var src;
var height;
var width;
const imageWidthPercent = (percentage) => Math.floor(width / 100 * percentage);
const imageHeightPercent = (percentage) => Math.floor(height / 100 * percentage);
var lastLineYAxis;
var linesArray = [];
var subImagesArray = [];

class PairPoints{
	startPoint;
	endPoint;

	constructor(startPoint, endPoint){
		this.startPoint = startPoint;
		this.endPoint = endPoint;
	}
}

function init() {
	lastLineYAxis = 0
	src = cv.imread('canvasInput');
	height = src.matSize[0];
	width = src.matSize[1];
	binarying();
}

function binarying(){
	grayTransform(src);
	cv.adaptiveThreshold(src,src,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY,55,8);
	applyClosure();
	splitImage(src);
	cv.imshow('canvasOutput',subImagesArray[32]);
	// cv.imshow('canvasOutput',src );
}

function colorizeTransform(){
	cv.cvtColor(src, src, cv.COLOR_GRAY2RGB, 0);
}

function splitImage(src){
	invertImage(src);
	var lines = new cv.Mat();
	cv.HoughLinesP(src, lines, 1,Math.PI/180,80,imageWidthPercent(70),imageWidthPercent(10));
	colorizeTransform();
	for (let i = 0; i < lines.rows; ++i) {
		let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
		let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
		if(isHorizontalLine(startPoint, endPoint) && startPoint.y > imageHeightPercent(20)){
			linesArray.push(new PairPoints(startPoint,endPoint));
			// cv.line(src, startPoint, endPoint, [0, 0, 255, 255]);
		}
	}
	organizeTableLines();
	for(let i = 0; i < linesArray.length -1; i++){
		let startPoint = linesArray[i].startPoint;
		let endPoint = linesArray[i].endPoint;
		let nextStartPointY = linesArray[i+1].startPoint.y;
		if(i == 0){
			console.log(startPoint)
			console.log(endPoint)
			console.log(nextStartPointY)
		}
		let rect = new cv.Rect(startPoint.x, startPoint.y,
			endPoint.x - startPoint.x, nextStartPointY - startPoint.y);
		subImagesArray.push(src.roi(rect));
	}
}

function organizeTableLines(){
	var newLinesArray = [];
	linesArray.sort((a,b) => {
		if(a.startPoint.y > b.startPoint.y) return 1;
		if(a.startPoint.y < b.startPoint.y) return -1;
		return 0;
	});
	linesArray.forEach(element => {
		let startPoint = element.startPoint;
		let endPoint = element.endPoint;
		if(compareLastLineYAxis(startPoint.y)){
			cv.line(src, startPoint, endPoint, [255, 0, 0, 255]);
			newLinesArray.push(element);
		}
	});
	linesArray = newLinesArray;
}

function compareLastLineYAxis(yAxis){
	let compare = lastLineYAxis + imageHeightPercent(2);
	if(yAxis > compare){
		lastLineYAxis = yAxis;
		return true;
	}
	return false;
}

function isHorizontalLine(startPoint, endPoint){
	return getLineAngle(startPoint,endPoint) < 5 || getLineAngle(startPoint,endPoint) > 355
			|| getLineAngle(startPoint,endPoint) > 175 && getLineAngle(startPoint,endPoint) < 185;
}

function getLineAngle(startPoint,endPoint){
	return  Math.abs(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180.0 / Math.PI);
}

function invertImage(src){
	let ones = new cv.Mat.ones(height,width, cv.CV_8U);
	ones = ones.mul(ones,255);
	cv.subtract(ones,src,src);
}

function applyClosure(){
	invertImage(src);
	let kernel = cv.Mat.ones(3, 3, cv.CV_8U);
	let anchor = new cv.Point(-1, -1);
	applyDilation(src,kernel, anchor);
	// applyErosion(src,kernel, anchor);
	invertImage(src);
}

function applyDilation(src,kernel, anchor){
	cv.dilate(src, src, kernel, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
}

function applyErosion(src,kernel, anchor){
	cv.erode(src, src, kernel, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
}

function grayTransform(image){
	cv.cvtColor(image, image, cv.COLOR_RGBA2GRAY, 0);
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
	init();
});