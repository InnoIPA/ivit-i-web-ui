/*
MIT License

Copyright (c) 2021 Andrey Semochkin
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Create P2P Service
let webrtc;

const videoEl = document.querySelector('#webrtc-video')

// Setup WebRTC: Asking for remote
async function setWebRTC(streamID){
    console.log('\t- Ask for setting webrtc');
    // Check URL
    let trg_url = `http://${DOMAIN}:8083/stream/${streamID}/channel/0/webrtc`;
    try{
        await $.post(trg_url, { data: btoa(webrtc.localDescription.sdp) })
        .done(async function (data) {
            // 如果同意的話就會回傳資訊，透過該資訊設定 WebRTC Remote 端的資訊
            // 當雙方都 setRemoteDescription 就可以開始連線
            try{
                console.log(data);

                webrtc.setRemoteDescription(
                    new RTCSessionDescription({
                        type: 'answer',
                        sdp: atob(data)
                    }))
                return true
            } catch (e){
                // can't setup webrtc
                console.warn('Can not setup WebRTC')
                return false;
            }
        })
        .fail(async function(xhr, textStatus, errorThrown){
            // maybe is register failed
            console.warn('Connect to WebRTC failed, reload windows to re-connect')
            // location.reload()
            // await setWebRTC()
            return false
        })
    } catch (e){
        // can't connect to webrtc
        console.warn('WebRTC Server has been crashed, please refresh page')
        // await setWebRTC()
    }

    
    return false;
}

// Connect to RTSPtoWeb Project
async function connectWebRTC(streamID) {
    
    if(!streamID){
        alert('Empty Stream ID'); return undefined;
    }

    // Create RTCPeerConnection
    console.log(`\t- Create Peer Connection: ${streamID}`);
    webrtc = new RTCPeerConnection({
        iceServers: [{
            urls: ['stun:stun.l.google.com:19302']
        }],
        sdpSemantics: 'unified-plan'
    })

    // ontrack
    // 完成連線後，透過該事件能夠在發現遠端傳輸的多媒體檔案時觸發，來處理/接收多媒體數據。
    console.log("\t- Define Track Event");
    webrtc.ontrack = function (event) {
        document.getElementById('webrtc-video').style.display = '';
        document.getElementById('loader').style.display = 'none';
        console.log('\t- ' + event.streams.length + ' track is delivered')
        videoEl.srcObject = event.streams[0]
        videoEl.play()
    }

    // Add Track or Transceiver to capture the video
    // 建立 RTP Stream 每次隨機產生 SSRC， 在 createOffer 的 SDP 當中會帶入
    // 並且建立 media session，當 ICE 成功建立 SRTP 連線就會把 Media Packet 送出去
    console.log("\t- Add Transceiver");
    webrtc.addTransceiver('video', { 'direction': 'sendrecv' })

    // onnegotiationneeded
    // 每當 RTCPeerConnection 要進行會話溝通(連線)時，第一次也就是在addTrack後會觸發該事件， 通常會在此處理createOffer，來通知remote peer與我們連線。
    console.log("\t- Define Negotiation");
    // webrtc.onnegotiationneeded = async function handleNegotiationNeeded() {
    //     console.log('\t- Create Offer');
    //     // 建立請求
    //     const offer = await webrtc.createOffer()
    //     // 提供本地端的資訊
    //     await webrtc.setLocalDescription(offer)
    //     // 使用 http 與 remote 進行請求，需要透過 sdp 去請求
    //     // setWebRTCInterval(streamID);
    //     await setWebRTC(streamID);
    // }
    
    let trg_url = `http://${DOMAIN}:8083/stream/${streamID}/channel/0/webrtc`;

    webrtc.onnegotiationneeded = async function handleNegotiationNeeded () {
        const offer = await webrtc.createOffer()
  
        await webrtc.setLocalDescription(offer)
  
        await fetch(trg_url, {
            method: 'POST',
            body: new URLSearchParams({ data: btoa(webrtc.localDescription.sdp) })
        })
        .then(response => response.text())
        .then(async data => {
            try {
                let setupFlag = true
                try {
                    /*  Failed Case 1 :  {
                            "status": 0,
                            "payload": stream not found
                        }
                        Failed Case 2 :  {
                            "status": 0,
                            "payload": stream channel codec not ready, possible stream offline
                        }
                    */
                    // console.warn(jsonData);
                    await addWebRTC(uuid, `rtsp://127.0.0.1:8554/${streamID}`);
                    console.error();(JSON.parse(data)['payload'] + ', ' + 'auto reload');
                    await new Promise(r => setTimeout(r, 1000));
                    location.reload()

                } catch {
                    /*  If the correct data, JSON.parse will be failed, because that have no key
                    
                        - Example: "dj0wDQpvPS0gMjAxNDY2NDMzODIyNTI4MDc5MyAx ... a=="
                    */
                    console.log(`\t- Get Description: ...${data.substring(10, 50)}...`);
                    webrtc.setRemoteDescription(
                        new RTCSessionDescription({ type: 'answer', sdp: atob(data) })
                    )
                }
            } catch (e) {
                console.warn(e)
            }
        })
    }

    // 建立 P2P 中雙向資料傳輸的通道
    console.log("\t- Create Data Channel");
    const webrtcSendChannel = webrtc.createDataChannel('rtsptowebSendChannel')

    // 當兩邊資料都對接上的時候會執行這個動作
    webrtcSendChannel.onopen = (event) => {
        console.log(`${webrtcSendChannel.label} has opened`)
        webrtcSendChannel.send('ping')
    }

    // 當呼叫 close() method 的時候
    webrtcSendChannel.onclose = (_event) => {
        console.log(`${webrtcSendChannel.label} has closed`);
        connectWebRTC(streamID);
    }
    // 呼叫 send() 並且兩邊都連接上的時候
    webrtcSendChannel.onmessage = event => console.log(event.data)
 
}

// Play Video Element
async function startStream() {
    document.getElementById('webrtc-video').controls = true;
    console.log("Start Video");
    videoEl.play();
}

// Pause Video Element
async function pauseStream() {
    console.log("Pause Video");
    videoEl.pause();
}

// Stop WebRTC Connection
async function stopStream() {
    console.log("Stop Stream");
    videoEl.pause();
    webrtc.close();
}

// Delete WebRTC
async function delWebRTC(streamID, debug=false){
    
    if(!streamID) { alert("Empty streamID ... " ); return undefined; };

    let url = `http://${DOMAIN}:8083/stream/${streamID}/delete`;
    
    let data = await getAPI( url, null, true, "demo:demo");    
    
    // if (debug) await getStreamList();  // For debug
}

// Add WebRTC
async function addWebRTC(streamID, streamURL){
    let api;

    // Create WebRTC
    if(!streamID) streamID = document.getElementById("rtsp-name").value;
    if(!streamURL) { alert("Unkown Stream URL"); return undefined; }

    api = `http://${DOMAIN}:8083/stream/${streamID}/add`;
    
    let inData =  {
        "name": streamID,
        "channels": {
            "0": {
                "name": "ch1",
                "url": streamURL,
                "on_demand": false,
                "debug": false,
                "status": 0
            }
        }
    }

    let runRtcData = await postAPI( api, inData, JSON_FMT, null, true, "demo:demo");
    if(!runRtcData) return undefined;
    console.log(runRtcData);
    
    // For debug
    getStreamList();

}

// Get WebRTC List
async function getStreamList(){
    let url;
    // url = "http://demo:demo@127.0.0.1:8083/streams";
    // url = "http://172.16.92.130:8083/streams"
    url = `http://${DOMAIN}:8083/streams`;

    let data = await getAPI( url, LOG, true, "demo:demo");
    if(!data){
        alert('webrtc server is crash !!')
        return undefined;
    }
    
    // get data
    data = data['payload'];
    const logData = [];
    for ( const key in data){ logData.push( data[key]['name'] ) }
    console.log( 'Check webrtc stream: ',  ...logData );
    return data;
}

async function getStreamInfo(uuid){
    let url = `http://${DOMAIN}:8083/stream/${uuid}/channel/0/info`

    let data = getAPI( url, LOG, true, "demo:demo" );
    if (!data){
        alert('get webrtc information failed !!')
        return undefined;
    }
    
    return data
}