let model, classifier, video, label, image_input, camcontainer;
let index = 1;
let imgisset = false;

async function setup() {
    // setup canvas for video input
    let canvas = createCanvas(320, 240);
    canvas.parent('webcam-container');
    video = createCapture(VIDEO);
    video.hide();

    // setup the model and classifier
    model = await ml5.featureExtractor('MobileNet', { numLabels: 3 }, modelReady);
    classifier = model.classification(video, videoReady);

    // load in the DOM elements for later reference.
    camcontainer = document.getElementById('webcam-container');
    class_img = document.getElementById('classifyme');
    image_input = document.getElementById("image-input");
    label = document.getElementById("resultLabel");

    // setup camera input button
    camButton = select("#useCam");
    camButton.mousePressed(function () {
        useWebcamInput();
    });

    // add event listener to the display the uploaded image
    image_input.addEventListener("change", function () {
        uploadNewImage(this);
    });
}

// Train model and start classifying once trained
function whileTraining(loss) {
    if (loss == null) {
        console.log('Training Complete');
        isTrained = true;
    } else {
        console.log(loss);
    }
}

// update label with results and loop classification
function gotResults(error, result) {
    if (error) {
        console.error(error);
    } else {
        // add strictness to results
        label.textContent = "Unsure";
        if (result[0].confidence.toFixed(2) > 0.70) {
            label.textContent = result[0].label + ' ' + result[0].confidence.toFixed(2) * 100 + '%';
            // added clause to inform user whether the identified trash is recycleable
            //if (result[0].label == "Can" || result[0].label == "Carton" || result[0].label == "Bottle") {
                label.textContent += ', recycleable';
            //}
        } 
        // classify either the uploaded image or the camera feed.
        if (index < 5) {
            if (!imgisset) {
                classifier.classify(video, gotResults);
            } else {
                classifier.classify(class_img, gotResults);
            }
            index++;
        }
    }
}

// Callback when model is loaded
function modelReady() {
    model.load("my_model/model.json", modelLoaded);
}

function modelLoaded() {
    console.log("model loaded...");
    label.textContent = 'Trash Recogniser';
}

// Callback when model is loaded
function videoReady() {
    console.log("Video loaded...");
}

// draw video feed on the canvas
function draw() {
    background(0);
    image(video, 0, 0, 320, 240);
    fill(255);
}

// upload an image from file and display it
async function uploadNewImage(input) {

    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            // hide the webcam canvas and disable the predict loop
            camcontainer.hidden = true;
            imgisset = true;

            // set the image and display it
            $('#classifyme').attr('src', e.target.result);
            $('#classifyme').hide();
            $('#classifyme').fadeIn(650);
            class_img.hidden = false;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// display video input and remove image if it is being displayed
async function useWebcamInput() {
    // display the webcam canvas and hide uploaded image
    if (imgisset) {
        camcontainer.hidden = false;
        class_img.hidden = true;
        imgisset = false;
    }
}

// classify the currently displayed image or video feed.
async function predictImage() {
    index = 1;
    if (!imgisset) {
        classifier.classify(video, gotResults);
    } else {
        classifier.classify(class_img, gotResults);
    }
}