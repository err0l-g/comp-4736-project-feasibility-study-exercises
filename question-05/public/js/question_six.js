let mediaRecorder;
let audioChunks = [];
let countdownInterval;

const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const transcriptionBox = document.getElementById('transcriptionBox');

recordBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', (event) => {
            audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener('stop', sendAudio);

        mediaRecorder.start();
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        
        let timeLeft = 5;
        statusDiv.textContent = `Recording... ${timeLeft}s remaining`;

        countdownInterval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft > 0) {
                statusDiv.textContent = `Recording... ${timeLeft}s remaining`;
            } else {
                clearInterval(countdownInterval);
                
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    
                    recordBtn.disabled = false;
                    stopBtn.disabled = true;
                    statusDiv.textContent = 'Processing...';
                }
            }
        }, 1000);

    } catch (err) {
        statusDiv.textContent = 'Error: Microphone access denied.';
        console.error("Microphone error:", err);
    }
});

stopBtn.addEventListener('click', () => {
    clearInterval(countdownInterval);
    
    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.textContent = 'Processing...';
});

async function sendAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
        const response = await fetch('/comp-4537/project-exercises/question_six/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        transcriptionBox.value = data.transcription || 'Error: No transcription received';
        statusDiv.textContent = 'Complete!';
    } catch (error) {
        transcriptionBox.value = `Error: ${error.message}`;
        statusDiv.textContent = 'Error occurred during processing.';
    }
}