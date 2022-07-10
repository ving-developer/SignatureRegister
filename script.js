var src;
var height;
var width;
const imageWidthPercent = (percentage) => Math.floor(width / 100 * percentage);
const imageHeightPercent = (percentage) => Math.floor(height / 100 * percentage);
var lastLineYAxis = 0;
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
	// cv.imshow('canvasOutput',subImagesArray[32]);
	cv.imshow('canvasOutput',src );
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
		// if(isHorizontalLine(startPoint, endPoint) && startPoint.y > imageHeightPercent(20)){
		if(isHorizontalLine(startPoint, endPoint) && startPoint.y > imageHeightPercent(8)){
			linesArray.push(new PairPoints(startPoint,endPoint));
			// cv.line(src, startPoint, endPoint, [0, 0, 255, 255]);
		}
	}
	organizeTableLines();
	for(let i = 0; i < linesArray.length -1; i++){
		let firstPoint = linesArray[i].startPoint;
		let secondPoint = linesArray[i].endPoint;
		let thirdPoint = linesArray[i+1].startPoint;
		let fourthPoint = linesArray[i+1].endPoint;
		let height = Math.sqrt((firstPoint.x-thirdPoint.x)*(firstPoint.x-thirdPoint.x) +
			(firstPoint.y-thirdPoint.y)*(firstPoint.y-thirdPoint.y));
		let width= Math.sqrt((firstPoint.x-secondPoint.x)*(firstPoint.x-secondPoint.x) +
			(firstPoint.y-secondPoint.y)*(firstPoint.y-secondPoint.y));
		let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [firstPoint.x, firstPoint.y, secondPoint.x,
			secondPoint.y, thirdPoint.x, thirdPoint.y, fourthPoint.x, fourthPoint.y]);
		let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, 0, height, width, height]);
		let M = cv.getPerspectiveTransform(srcTri, dstTri);
		let dst = new cv.Mat();
		cv.warpPerspective(src,dst, M, new cv.Size(width, height));
		subImagesArray.push(dst);
	}
}

function realignImage(){
	let firstLine = linesArray[linesArray.length - 1];
	let angle = getLineAngle(firstLine.startPoint,firstLine.endPoint,false);
	let center = new cv.Point(Math.floor(width/2),Math.floor(height/2));
	let M = cv.getRotationMatrix2D(center, angle, 1.0);
	cv.warpAffine(src, src, M, src.size(), cv.INTER_CUBIC);
}

function organizeTableLines(){
	var newLinesArray = [];
	linesArray.sort((a,b) => {
		if(a.startPoint.y > b.startPoint.y) return -1;
		if(a.startPoint.y < b.startPoint.y) return 1;
		return 0;
	});
	linesArray.forEach(element => {
		element = getExtendedLine(element);
		let startPoint = element.startPoint;
		let endPoint = element.endPoint;
		if(compareLastLineYAxis(startPoint.y)){
			cv.line(src, startPoint, endPoint, [255, 0, 0, 255]);
			newLinesArray.unshift(element);
		}
	});
	linesArray = newLinesArray;
}

function getExtendedLine(pairPointLine){
	let slop = (pairPointLine.endPoint.y - pairPointLine.startPoint.y) / (pairPointLine.endPoint.x - pairPointLine.startPoint.x);
	let n = pairPointLine.startPoint.y - (slop * pairPointLine.startPoint.x);
	let newStartPoint = new cv.Point(0,n);
	let newEndPoint = new cv.Point(width, slop * width + n);
	return new PairPoints(newStartPoint,newEndPoint);
}

function compareLastLineYAxis(yAxis){
	if(lastLineYAxis == 0){
		lastLineYAxis = yAxis;
		return true;
	}
	let compare = lastLineYAxis - imageHeightPercent(2);
	if(yAxis < compare){
		lastLineYAxis = yAxis;
		return true;
	}
	return false;
}

function isHorizontalLine(startPoint, endPoint){
	return getLineAngle(startPoint,endPoint) < 5 || getLineAngle(startPoint,endPoint) > 355
			|| getLineAngle(startPoint,endPoint) > 175 && getLineAngle(startPoint,endPoint) < 185;
}

function getLineAngle(startPoint,endPoint, abs = true){
	return  abs ? Math.abs(Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180.0 / Math.PI) :
	Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180.0 / Math.PI;
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

utils.loadImageToCanvas('Assets/Images/page2.jpg', 'canvasInput');
utils.addFileInputHandler('fileInput', 'canvasInput');

let tryIt = document.getElementById('tryIt');
tryIt.addEventListener('click', () => {
	init();
});

utils.loadOpenCv(() => {
    tryIt.removeAttribute('disabled');
	init();
});