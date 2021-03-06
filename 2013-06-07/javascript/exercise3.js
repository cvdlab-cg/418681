//*********************************************************************************************************************
//*********************************************************************************************************************
//Funzione che disegna il territorio

var matrixPointsZ = {};
function getAreaPoints(x, y, xHill, yHill, xMountain, yMountain, area_identifier) {
	var points = new Array();
	for (key in matrixPointsZ) {
		xy = coordinateFromAttribute(key);
		x_coordinate = xy[0][0];
		y_coordinate = xy[0][1];
		z_coordinate = matrixPointsZ[key];
		var p = new Array();
		p.push(x_coordinate);
		p.push(y_coordinate);
		p.push(z_coordinate);
		if (area_identifier === 0) {
			if (x_coordinate < xHill && y_coordinate < yHill) points.push(p);
		}
		else if (area_identifier === 1) {
			if (x_coordinate < xMountain && y_coordinate < yMountain && x_coordinate >= xHill && y_coordinate >= yHill) points.push(p);
			else if (x_coordinate < xHill && y_coordinate < yMountain && y_coordinate > yHill + 1 && x_coordinate > 0.5) points.push(p);
		}
		else if (area_identifier === 2) {
			if (x_coordinate >= xMountain && y_coordinate >= yMountain) points.push(p);
		}
	}
	return points;
}

function retrieveMiniArea(area, area_identifier, x, xHill, xMountain) {
	var areas = new Array();
	var first_subarea = new Array();
	var second_subarea = new Array();
	for (var i=0; i<area.length; i++) {
		if (area_identifier === 0) {
			var x_median = xHill/2;
			if (area[i][0] < x_median) first_subarea.push(area[i]);
			else if (area[i][0] >= x_median) second_subarea.push(area[i]);
		}
		else if (area_identifier === 1) {
			var x_median = (xMountain+xHill)/2;
			if (area[i][0] < x_median) first_subarea.push(area[i]);
			else if (area[i][0] >= x_median) second_subarea.push(area[i]);
		}
		else if (area_identifier === 2) {
			var x_median = (x+xMountain)/2;
			if (area[i][0] < x_median) first_subarea.push(area[i]);
			else if (area[i][0] >= x_median) second_subarea.push(area[i]);
		}
	}
	areas.push(first_subarea);
	areas.push(second_subarea);
	return areas;
}

function getRandomPointIndexFromArea(area) { return Math.floor(Math.random()*area.length); }

function randomHill(hillLevel) { return Math.random()*hillLevel; }

function randomMountain(mountainLevel) {
	var casual = Math.random();
	if (casual > 0.5)
		return casual*mountainLevel;
	return -(casual*mountainLevel);
}

function createAttribute(x, y) { return (x+"_"+y); }


function coordinateFromAttribute(str) {
	var k = new Array();
	k.push(str.split("_"));
	return k;
}

function DTM(x,y, plainLevel, hillLevel,mountainLevel, rangePartitionsX,curvePoints) {
	var domainDTM = PROD1x1([INTERVALS(1)(50),INTERVALS(1)(50)]);
	var xTresholdLake = (x/4);
	var yTresholdLake = (y/4);
	var xTresholdHill = (x*(3/4));
	var yTresholdHill = (y*(3/4));
	var bezierLineSet = new Array();
	var lastI = 0;
	for (var i=0; i<=x; i=i+(x/rangePartitionsX)) {
		if (i <= x) {
		if (i===0 || i===x) { bezierLineSet.push(BEZIER(S0)([[i,0,0],[i,y,0]])); }
		else {
			var controlPointsArray = new Array();
			var lastJ = 0;
			for (var j=0; j<=y; j=j+(y/curvePoints)) {
				if (j===0 || j===y) {
					controlPointsArray.push([i,j,plainLevel]);
					matrixPointsZ[createAttribute(i, j)] = plainLevel;
				}
				else {
					if (i < xTresholdLake && j < yTresholdLake) {
						controlPointsArray.push([i,j,plainLevel]);
						matrixPointsZ[createAttribute(i, j)] = plainLevel;
					}
					else if (i < xTresholdHill && j < yTresholdHill) {
						var z = randomHill(hillLevel);
						controlPointsArray.push([i,j,z]);
						matrixPointsZ[createAttribute(i, j)] = z;
					}
					else {
						var z = randomMountain(mountainLevel)
						controlPointsArray.push([i,j,z]);
						matrixPointsZ[createAttribute(i, j)] = z;
					}
				}
				lastJ += j;
			}
			if (lastJ !== y) {
				controlPointsArray.push([i,y,plainLevel]);
				matrixPointsZ[createAttribute(i, y)] = plainLevel;
			}
			bezierLineSet.push(BEZIER(S0)(controlPointsArray));
		}
	}
	lastI += i;
	}
	if (lastI !== x) {
		bezierLineSet.push(BEZIER(S0)([[x,0,0],[x,y,0]]));
	}
	var colore = [85/255, 104/255, 50/255, 1];
	return COLOR(colore)(MAP(BEZIER(S1)(bezierLineSet))(domainDTM));
}

var x = 15;
var y = 10;
var plainLevel = 0;
var hillLevel = 2;
var mountainLevel = 15;
var rangePartitionsX = 75;
var curvePoints = 75;

territorio = DTM(x,y, plainLevel, hillLevel,mountainLevel,rangePartitionsX,curvePoints);

//*********************************************************************************************************************
//Funzione che disegna il lago

var xLake = x/2;
var yLake = y/2; 
var depthLake = randomHill(hillLevel)/2-0.1;
var colorLake = [0, 15/255, 117/255, 1];

function drawLake(xLake, yLake, depthLake, colorLake) {

	var pointsbaselake = [[0,0],[xLake,0],[0,yLake],[xLake,yLake]];
	var cellsbaselake = [[0,1,3],[0,2,3]];
	var baselake = SIMPLICIAL_COMPLEX(pointsbaselake)(cellsbaselake);
	var lake = COLOR(colorLake)(EXTRUDE([depthLake])(baselake))
	return lake;
}

var lake = drawLake(xLake, yLake, depthLake, colorLake);

//*********************************************************************************************************************
//Funzione che disegna un albero

function drawTree(hfoliage, htrunk, colorTree) {

	var domain = PROD1x1([INTERVALS(1)(30),INTERVALS(1)(30)]);
	
	var c0 = BEZIER(S0)([[2.31, 3.81, 0], [2.37, 5.21, 0], [4.35, 5.22, 0], [4.43, 3.84, 0]]);
	var c1 = BEZIER(S0)([[2.31, 3.81, 0], [2.44, 2.44, 0], [4.32, 2.4, 0], [4.43, 3.84, 0]]);
	
	var p1 = [[3.38, 3.83, hfoliage]];
	
	var c2 = BEZIER(S0)(p1);
	var curve1 = BEZIER(S1)([c0,c2]);
	
	var surface0 = MAP(curve1)(domain);
	var c3 = BEZIER(S0)(p1);
	
	var curve2 = BEZIER(S1)([c1,c3]);
	var surface1 = MAP(curve2)(domain);
	
	var foliage = COLOR(colorTree)(STRUCT([surface0, surface1]));

	var fillbasefoliage = COLOR(colorTree)(MAP(BEZIER(S1)([c0,c1]))(domain));

	var trunk = COLOR(92/255, 51/255, 23/255)(T([0,1,2])([3.38, 3.83, -(htrunk-(hfoliage/2))])(EXTRUDE([htrunk])(DISK(0.15)(50))));
	
	var tree0 = STRUCT([foliage, trunk, fillbasefoliage]);
	var tree1 = T([0,1,2])([-3.38, -3.83,htrunk-(hfoliage/2)])(tree0);
	var tree = S([0,1,2])([0.05,0.05,0.05])(tree1);
return tree;
}

var hfoliage = 3;
var htrunk = 4;
var colorTree = [34/255, 139/255, 34/255];
var tree = drawTree(hfoliage, htrunk, colorTree);

//*********************************************************************************************************************
////Inserimento alberi e creazione del modello

var areaPoints = getAreaPoints(x,y,(x/4),(y/4),(x*(3/4)),(y*(3/4)), 1);
var subareas = retrieveMiniArea(areaPoints, 1, x, (x/4), (y*(3/4)));
var forest_subarea = subareas[0];
var settlement_subarea = subareas[1];

var n_trees = 100;
for (var n=0; n<n_trees; n++) {
	var pointIndex = getRandomPointIndexFromArea(forest_subarea);
	var point = forest_subarea[pointIndex];
	DRAW(T([0,1,2])([point[0], point[1], 0.9])(tree))
	forest_subarea.splice(pointIndex, 1);
}

var model = STRUCT([territorio, lake]);
DRAW(model);

//*********************************************************************************************************************
//*********************************************************************************************************************
