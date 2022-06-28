function init() {
	initSlpit();
}
function initSlpit() {
	let src= cv.imread('canvasInput');
	let rgbplanes = new cv.MatVector();
	let rgbplanes2 = new cv.MatVector();
	let zero = cv.Mat.zeros(1572,1128,cv.CV_8U);
	cv.split(src,rgbplanes);
	rgbplanes2.push_back(rgbplanes.get(0));
	rgbplanes2.push_back(zero);
	rgbplanes2.push_back(zero);
	let final = new cv.Mat();
	cv.merge(rgbplanes2,final);
	cv.imshow('canvasOutput',final );
}

function initCut() {
	let src = cv.imread('canvasInput');
	let gray = new cv.Mat();
	let padded = new cv.Mat();
	cv.copyMakeBorder(src, padded, 44, 44, 44, 44,
		cv.BORDER_REFLECT);
	let regiao = new cv.Rect(44, 44, 1572, 1128);
	src = padded.roi(regiao);
}
function initBasic() {
 //convert to grayscale
 //cv.cvtColor(src, gray,cv.COLOR_RGBA2GRAY);
 //Blur
 cv.blur(src,src,new cv.Size(9,9));
 cv.imshow('canvasOutput',src );
}


let utils = new Utils('errorMessage');

utils.loadImageToCanvas('Assets/Images/page1.jpg', 'canvasInput');
utils.addFileInputHandler('fileInput', 'canvasInput');

let tryIt = document.getElementById('tryIt');
tryIt.addEventListener('click', () => {
	init();
});

utils.loadOpenCv(() => {
    tryIt.removeAttribute('disabled');
});