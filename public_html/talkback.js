// Global variables

let isMicActive = false;
let pc;
let canvas = document.getElementById('vuMeter');
const canvasCtx = canvas.getContext('2d');
let analyser;
let dataArray;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const signalingServer = 'ws://localhost:8080';
const ws = new WebSocket(signalingServer);
const micButtonCheckbox = document.getElementById('micButton');

//Websocket handlers
ws.onopen = function() {
    console.log('Connected to the signalling server');
}

ws.onmessage = function(message){
    const signal = JSON.parse(message.data);
    if(signal.type === 'offer'){
        handleOffer(signal.offer);
    } else if (signal.type === 'answer'){
        handleAnswer(signal.answer);
    } else if (signal.tyep === 'candidate'){
        handleCandidate(signal.candidate);
    } else if (signal.type === 'close'){
        closePeerConnection();
    }
};

ws.onerror = function(err) {
    console.error('WebSocket error:', err);
};

// Event listener for the 'Listen' button
document.getElementById('listen-btn').addEventListener('click', function() {
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Playback resumed successfully');
        }).catch(error => console.error('Error resuming audio context:', error));
    }
});

//VU Meter
function drawVUMeter(){
    requestAnimationFrame(drawVUMeter);
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.fillStyle = '#000';
    canvasCtx.fillRect(0,0, canvas.clientWidth, canvas.clientHeight);

    let barWidth = (canvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;

    }
}

//Start VUMeter with given media stream
function startVUMeter(stream){
    if (!analyser0){
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        canvasCtx.clearRect (0,0, canvas.width, canvas.height);
        drawVUMeter();
    }
}

//Initalise peer connection
function initalisePeerConnection(){
    if (!pc){
        pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19032'}]});

        pc.ontrack = function(event){
            if (event.track.kind === 'audio'){
                let audio = document.createElement('audio');
                audio.autoplay = true;
                audio.srcObject = event.streams[0];

                audio.onloadedmetadata = function(e){
                    console.log('Audio is now playing');
                    audio.play().catch(error => console.error('Error playing audio:', error));

                };
                document.body.appendChild(audio);
            }
        };
        pc.onicecandidate = function(event){
            if(event.candidate){
                ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate}));

            }
        };
        pc.oniceconnectionstatechange = function(event){
            if(pc.iceConnectionState === 'disconnected') {
                console.log('Disconnected from ICE');
                closePeerConnection();
            }
        };
    }
}

//Handles close the peer connection
function closePeerConnection(){
    if (pc){
        pc.getSenders().foreach(sender => sender.track && sender.track.stop());
        pc.close();
        pc = null;
        console.log('Peer connection closed');
    }
}

//Function to jandle an offer from the signalling server
async function handleOffer(offer){
    initalisePeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({ type: 'answer', answer: pc.localDescription}));
}

//function to handle an answer from the server
async function handleAnswer(answer){
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

// Functiomn to handle ICE candidate from the singlaing server
function handleCandidate(candidate){
    pc.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
        console.log('ICE candidate added successfully');
    }).catch(error => console.error('Error adding ICE candidate:', error));
}

//Event listener for the microphone button
micButtonCheckbox.addEventListener('change', async function() {
    if (micButtonCheckbox.checked){
        try {
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            if (!pc || pc.signallingState === 'closed') {
                initalisePeerConnection();
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true});
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            startVUMeter(stream);

            isMicActive = true;
        }catch (error) {
            console.error('Error accessing the microphone:', error);
            micButtonCheckbox.checked = false;
        }
    } else {
        closePeerConnection();
        isMicActive = false;
        if (audioContext){
            audioContext.suspend();
        }
        canvasCtx.clearRect(0,0, canvas.width, canvas.height);

    }
});