// ---------------------------------------------------------------------------------------------------
const sourceUploader = document.querySelector('[data-target="file-uploader"]');
sourceUploader.addEventListener("change", sourceFileUpload);
// ---------------------------------------------------------------------------------------------------
const editSourceUploader = document.querySelector('[data-target="edit-source-file-uploader"]');
editSourceUploader.addEventListener("change", editSourceFileUpload);


async function editSourceFileUpload(e) {
    try {
        const file = e.target.files[0];
        const filename = file.name;
        const extension = file.type;
        // setUploading(true);

        if (!file) return;

        // const beforeUploadCheck = await beforeUpload(file);
        // if (!beforeUploadCheck.isValid) throw beforeUploadCheck.errorMessages;

        // const arrayBuffer = await getArrayBuffer(file);
        // const response = await uploadFileAJAX(arrayBuffer);

        // alert("File Uploaded Success");
        console.log(file);
        document.getElementById('edit_source_file_label').textContent = filename;
        document.getElementById('edit_source_file_label').value = filename;
        // showPreviewImage(file);
    } catch (error) {
        alert(error);
        console.log("Catch Error: ", error);
    } finally {
        // e.target.value = '';  // reset input file
        // setUploading(false);
    }
}

async function sourceFileUpload(e) {
    try {
        const file = e.target.files[0];

        // const beforeUploadCheck = await beforeUpload(file);
        // if (!beforeUploadCheck.isValid) throw beforeUploadCheck.errorMessages;

        document.getElementById('custom_file_label').textContent = file['name'];
        document.getElementById('custom_file_label').value = file['name'];

    } catch (error) {
        alert(error);
        console.log("Catch Error: ", error);
    } finally {
        // e.target.value = '';  // reset input file
        // setUploading(false);
    }
}

async function modelFileUpload(e) {
    try {
        const file = e.target.files[0];
        // setUploading(true);
        if (!file) return;

        // const beforeUploadCheck = await beforeUpload(file);
        // if (!beforeUploadCheck.isValid) throw beforeUploadCheck.errorMessages;

        // const arrayBuffer = await getArrayBuffer(file);
        // const response = await uploadFileAJAX(arrayBuffer);

        // alert("File Uploaded Success");
        console.log(file);
        document.getElementById('import_model_file_label').textContent = file['name'];
        document.getElementById('import_model_file_label').value = file['name'];
        // showPreviewImage(file);
    } catch (error) {
        alert(error);
        console.log("Catch Error: ", error);
    } finally {
        // e.target.value = '';  // reset input file
        // setUploading(false);
    }
}
// ---------------------------------------------------------------------------------------------------
async function labelFileUpload(e) {
    try {
        const file = e.target.files[0];
        // setUploading(true);
        if (!file) return;

        console.log(file);
        document.getElementById('import_label_file_label').textContent = file['name'];
        // showPreviewImage(file);
    } catch (error) {
        alert(error);
        console.log("Catch Error: ", error);
    } finally {
        // e.target.value = '';  // reset input file
        // setUploading(false);
    }
}
// ---------------------------------------------------------------------------------------------------
async function configFileUpload(e) {
    try {
        const file = e.target.files[0];
        // setUploading(true);
        if (!file) return;

        console.log(file);
        document.getElementById('import_config_file_label').textContent = file['name'];
        // showPreviewImage(file);
    } catch (error) {
        alert(error);
        console.log("Catch Error: ", error);
    } finally {
        // e.target.value = '';  // reset input file
        // setUploading(false);
    }
}
// ---------------------------------------------------------------------------------------------------
// change file object into ArrayBuffer
function getArrayBuffer(fileObj) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // Get ArrayBuffer when FileReader on load
        reader.addEventListener("load", () => {
            resolve(reader.result);
        });

        // Get Error when FileReader on error
        reader.addEventListener("error", () => {
            reject("error occurred in getArrayBuffer");
        });

        // read the blob object as ArrayBuffer
        // if you nedd Base64, use reader.readAsDataURL
        reader.readAsArrayBuffer(fileObj);
    });
}
// ---------------------------------------------------------------------------------------------------
// upload file throguth AJAX
// - use "new Uint8Array()"" to change ArrayBuffer into TypedArray
// - TypedArray is not a truely Array,
//   use "Array.from()" to change it into Array
function uploadFileAJAX(arrayBuffer) {
    // correct it to your own API endpoint
    return fetch("https://jsonplaceholder.typicode.com/posts/", {
        headers: {
            version: 1,
            "content-type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
            imageId: 1,
            icon: Array.from(new Uint8Array(arrayBuffer))
        })
    })
        .then(res => {
            if (!res.ok) {
                throw res.statusText;
            }
            return res.json();
        })
        .then(data => data)
        .catch(err => console.log("err", err));
}
// ---------------------------------------------------------------------------------------------------
// Create before upload checker if needed
function beforeUpload(fileObject) {

    return new Promise(resolve => {

        let inputTypeEleName = "source_type_menu";
        if(window[MODE]===EDIT_MODE){
            inputTypeEleName = `edit_${inputTypeEleName}`;
            console.log(inputTypeEleName);
        }
        const inputType = document.getElementById(inputTypeEleName).value;

        let validFileTypes = []
        if(inputType==="Image"){
            validFileTypes = ["image/jpeg", "image/png"];    
        } else if (inputType==="Video") {
            validFileTypes = ["image/jpeg", "image/png"];
        }
        
        const isValidFileType = validFileTypes.includes(fileObject.type);
        let errorMessages = [];

        if (!isValidFileType) {
            errorMessages.push("You can only upload JPG or PNG file!");
        }

        const isValidFileSize = fileObject.size / 1024 / 1024 < 2;
        if (!isValidFileSize) {
            errorMessages.push("Image must smaller than 2MB!");
        }

        resolve({
            isValid: isValidFileType && isValidFileSize,
            errorMessages: errorMessages.join("\n")
        });
    });
}
// ---------------------------------------------------------------------------------------------------
function setUploading(isUploading) {
    if (isUploading === true) {
        spinner.classList.add("opacity-1");
    } else {
        spinner.classList.remove("opacity-1");
    }
}
