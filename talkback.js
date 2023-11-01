let isMicActive = false;
const micButtonCheckbox = document.getElementById('micButton');
const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]});

//Event listener for micButton checkbox
micButtonCheckbox.addEventListener('change', function() {
    if (micButtonCheckbox.checked) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream =>{
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        });
        isMicActive = true;
        document.querySelector(".button-message span").innerText = "MUTE";
    } else {
        //Mute microphone
        pc.getLocalStreams().forEach(stream => {
            stream.getAudioTracks().forEach(track => track.stop());
        });
        pc.close();
        isMicActive = false;
        document.querySelector(".button-message span").innerText = "PRESS TO TALK";
    }
});