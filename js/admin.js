let model, classifier, video, label, image_input, camcontainer, class_img, training_img;
let trainButton;
let saveButton;
let loadButton;
let index = 1;
let imgisset = false;
let path;
let type;
let limit;
let isTrained = false;

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
    training_img = document.getElementById('trainme');
    camcontainer = document.getElementById('webcam-container');
    class_img = document.getElementById('classifyme');
    image_input = document.getElementById("image-input");
    trainButton = document.getElementById("train-button");
    label = document.getElementById("resultLabel");

    // setup camera input button
    camButton = select("#useCam");
    camButton.mousePressed(function () {
        useWebcamInput();
    });

    // setup model train button
    if (trainButton !== null) {
        trainButton.addEventListener("click", function () {
            classifier.train(whileTraining);
        });
    }

    // setup model save button
    saveButton = select("#save");
    if (saveButton !== null) {
        saveButton.mousePressed(function () {
            classifier.save();
        });
    }
    // setup model load button
    loadButton = select("#load");
    if (loadButton !== null) {
        loadButton.changed(function () {
            classifier.load(loadButton.elt.files, function () {
                select("#modelStatus").html("Custom Model Loaded!");
            });
        });
    }

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

// add the current frame or uploaded image to the designated class for training.
function classNewImage(type) {
    let toClass = document.getElementById("defaultCanvas0");
    if (imgisset) {
        toClass = class_img;
    }
    classifier.addImage(toClass, type);
    console.log("added " + toClass + " as " + type);
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

// load in samples from the specified folder
function loadSamples(new_path, new_type, new_limit) {
    index = 1;
    type = new_type;
    path = new_path;
    limit = new_limit;
    training_img.hidden = false;
    training_img.addEventListener("load", loadNewImage());
}

// load in new sample image
function loadNewImage() {
    training_img.src = "images/" + path + "/" + type + " (" + index + ")" + ".jpg";
    training_img.width = 400;
    training_img.height = 400;
    addNewImage();
}

// classify the sample image
function addNewImage() {
    classifier.addImage(document.getElementById('trainme'), type, imageAdded);
}

// on callback, rerun sample loading function
async function imageAdded() {
    if (index < limit) {
        index += 1;
        // a short delay to ensure the image is properly loaded before moving on
        await delay(250);
        loadNewImage();
    } else {
        training_img.hidden = true;
    }
}

// wait for the specified time
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
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