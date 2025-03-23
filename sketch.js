
var font_type = 'Arial';   
var font_height = 14;      
var font_color = 'white';  
var canvas_height = 5000;
var selectedIndex = -1;    
var sectors = [];          
var currentCenterX, currentCenterY; 
var womenShare; 
var panelWidth = 400; 
var panelHeight = 220; 
let showExplanation = false;
let explanationButton;
let showAllLabels = false;   
let showLabelsButton;   

var bubbles = [];                  
var bubblesAnimating = false;      
var bubbleAnimationStartTime = 0;  
var bubbleAnimationDuration = 3000; 
var bubbleAnimationButton;         
let selectedBubbleIndex = -1;
let legendValueX, legendValueY;

var table, majors, men, women, totals, maxLogValue;

var radialMaxRadius = 100;   
var ringWidth = 50;          
var ringInnerRadius;         
var infoPanelsY; 
const panelColors = ['#722E60', '#E8BE92', '#3A1F49', '#5D3C5A']; 


let selectedIndexMajor = 0; 
let selectMenu;

function preload() {
  table = loadTable("data/women-stem.csv", "csv", "header");
}

function setup() {

  createCanvas(windowWidth, canvas_height); 
  angleMode(RADIANS);

  majors = table.getColumn("Major");
  men = table.getColumn("Men").map(Number);
  women = table.getColumn("Women").map(Number);
  totals = men.map((m, i) => m + women[i]);
  womenShare = table.getColumn("ShareWomen").map(Number);
  
  const logMenArr = men.map(v => Math.log(v + 1));
  const logWomenArr = women.map(v => Math.log(v + 1));
  maxLogValue = Math.max(...logMenArr, ...logWomenArr);

  selectMenu = createSelect();
  selectMenu.position(20, 20);


  majors.forEach((major, index) => {
    selectMenu.option(major, index);
  });

  selectMenu.changed(() => {
    selectedIndexMajor = int(selectMenu.value());
    redraw(); 
  });

  textFont(font_type);
  textSize(font_height);

  setupBubbleAnimationButton();

  ringInnerRadius = radialMaxRadius - ringWidth; 
  infoPanelsY = drawMainTitle() * 2 + width + 400;


}

function windowResized() {
  resizeCanvas(windowWidth, canvas_height);
}


function draw() {
  background('#10032C');

  const titleHeight = drawMainTitle();
  
  currentCenterX = width / 2;
  currentCenterY = titleHeight *2+width / 2;

  let majorCount = majors.length;
  let gap = radians(1.5);
  let startAngleGlobal = 0 * PI;
  let endAngleGlobal = 2 * PI;
  let totalSweep = endAngleGlobal - startAngleGlobal;
  let availableAngle = totalSweep - (gap * majorCount);
  let angleStep = availableAngle / majorCount;
  let maxRadius = min(currentCenterX, height - currentCenterY) * 0.7;

  sectors = [];


  for (let i = 0; i < majorCount; i++) {
    
    let logMen = Math.log(men[i] + 1);
    let logWomen = Math.log(women[i] + 1);
    let radiusMen = map(logMen, 0, maxLogValue, 0, maxRadius);
    let radiusWomen = map(logWomen, 0, maxLogValue, 0, maxRadius);
    
    let startAngle = startAngleGlobal + i * (angleStep + gap);
    let midAngle = startAngle + angleStep * 0.5;
    let endAngle = startAngle + angleStep;
    
    sectors.push({
      start: startAngle,
      end: endAngle,
      maxRadius: Math.max(radiusMen, radiusWomen),
      major: majors[i],
      midAngle: (startAngle + endAngle) / 2
    });

    noStroke();
    fill('#722E60');
    arc(currentCenterX, currentCenterY, radiusMen * 2, radiusMen * 2, startAngle, midAngle, PIE);

    fill('#E8BE92');
    arc(currentCenterX, currentCenterY, radiusWomen * 2, radiusWomen * 2, midAngle, endAngle, PIE);

    line(
      currentCenterX + cos(startAngle) * maxRadius,
      currentCenterY + sin(startAngle) * maxRadius,
      currentCenterX + cos(startAngle) * (maxRadius + 20),
      currentCenterY + sin(startAngle) * (maxRadius + 20)
    );
  }

  if (selectedIndex !== -1) {
    drawSelectedLabel();
  }

  drawScaleAnnotations(currentCenterX, currentCenterY);
  drawCenterCircle(currentCenterX, currentCenterY);
  drawLegend(currentCenterY, maxRadius);
  drawInfoPanel(); 
    
  if (showExplanation) {
    drawLogExplanation();
  }
    drawExplanationButton(currentCenterX, currentCenterY, maxRadius);
   
   drawBubbleChart();

  drawRadialStackedChart();
  drawInfoPanels(); 
}


function drawMainTitle() {
  let titleHeight = 0;
  
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  
  textSize(map(width, 500, 2500, 20, 35));
  let mainY = map(height, 500, 2000,5,10);
  text("How Does the Gender Gap Vary Across STEM Majors?", width/2, mainY);
  
  textSize(map(width, 500, 2500, 15, 20));
  fill(200);
  let subY = map(height, 500, 2000, 15, 25);
  text("Gender Distribution of STEM Undergraduate Graduates in the XX Region for 20XX", width/2, subY);
  
  return subY + map(height, 500, 2000, 10, 20);
}


function getSectorCenterAngle(i, angleStep, gap) {
  let startAngle = i * (angleStep + gap);
  return startAngle + angleStep / 2;
}

function drawCenterCircle(currentCenterX, currentCenterY) {
  let centerRadius = (min(currentCenterX, height - currentCenterY))*0.7/3; 
  fill('#10032C');
  stroke('#FBE8D1');
  strokeWeight(2);
  drawingContext.setLineDash([5, 5]);
  ellipse(currentCenterX, currentCenterY, centerRadius * 2);
  drawingContext.setLineDash([]);
}

function drawScaleAnnotations(cx, cy) {
  let steps = 5;
  let maxRadius = min(width / 2, height - cy) * 0.7; 
  fill(100);
  textAlign(CENTER, TOP);

  for (let i = 1; i <= steps; i++) {
    let r = maxRadius * (i / steps);
    let value = Math.exp(maxLogValue * (i / steps)) - 1;

    noFill();
    stroke(120);
    strokeWeight(1);
    ellipse(cx, cy, r * 2); 

    let annotationX = cx+r;
    let annotationY = cy; 
    noStroke();
    fill(180);
    textSize(map(width, 500, 2500, 8, 10));
    text(nf(value, 0, 0), annotationX, annotationY);
  }
}


function drawLegend(centerY, maxRadius) {
  const chartBottom = centerY + maxRadius;
  const legendMargin = 50;
  let legendX = width*4/5;
  let legendY = min(chartBottom + legendMargin, height - 100);
  let boxSize = 20;

  noStroke();
  
  fill('#722E60');
  rect(legendX, legendY, boxSize*2, boxSize);
  fill(255);
  textSize(map(width, 500, 2500, 15, 30));
  text('Men', legendX  + boxSize*4, legendY);

  fill('#E8BE92');
  rect(legendX, legendY + 80, boxSize*2, boxSize);
  fill(255);
  text('Women', legendX + boxSize*4, legendY + 80);
}

function toggleExplanation() {
  showExplanation = !showExplanation;
  if (explanationButton) {
    explanationButton.html(showExplanation ? "Hide Explanation" : "Show Explanation");
  }
}

function drawLogExplanation() {
  const boxWidth = width * 2 / 3;
  const boxHeight = (2 / 3) * boxWidth;
  const explanationY = width / 2;

  fill(0, 0, 0, 200);
  stroke(200);
  rect((width - boxWidth) / 2, explanationY, boxWidth, boxHeight, 10);

  fill(255);
  textSize(map(width, 500, 2500, 15, 40));
  textAlign(LEFT, TOP);
  let lineY = explanationY + 20;
  const explanations = [
    "Visualization Note:",
    "- Radius calculation: log(value + 1)",
    "- Example scaling:",
    "  100 → " + Math.log(101).toFixed(1) + "  1000 → " + Math.log(1001).toFixed(1),
    "- Improves small values visibility"
  ];

  explanations.forEach(line => {
    text(line, (width - boxWidth) / 2 + 10, lineY);
    lineY += 30;
  });
}

function drawExplanationButton(centerX, centerY, maxRadius) {
  const buttonX = 50; 
  const buttonY = centerY + maxRadius + 60; 

  if (!explanationButton) {
    explanationButton = createButton("Show Explanation");
    explanationButton.mousePressed(toggleExplanation);
  }
  explanationButton.position(buttonX, buttonY);
}


function drawSelectedLabel() {
  let sector = sectors[selectedIndex];
  let labelSettings = {
    baseRadius: min(currentCenterX, height - currentCenterY) * 0.7 - 20,
    verticalRadiusBoost: 20,
    fontSize: map(width, 500, 2500, 4, 10),
    labelAlpha: 200,
    lineLength: map(width, 500, 2500, 200, 400),
    textPadding: map(width, 500, 2500, 30, 50)
  };
  
  let pos = calculateLabelPosition(
    currentCenterX,
    currentCenterY,
    sector.midAngle,
    labelSettings
  );
  
  stroke(255, 200);
  line(pos.startX, pos.startY, pos.textX, pos.textY);
  
  fill(255);
  noStroke();
  textSize(map(width, 500, 2500, 8, 12));
  textAlign(pos.align, CENTER);
  text(sector.major, pos.textX, pos.textY);
  }
  
  function calculateLabelPosition(cx, cy, angle, settings) {
  let angleCos = cos(angle);
  let angleSin = sin(angle);
  let verticalRatio = abs(angleSin);
  
  let finalRadius = settings.baseRadius;
  if (verticalRatio > 0.99) {
    finalRadius += settings.verticalRadiusBoost * pow(verticalRatio, 100);
  }
  
  let isRight = angleCos > 0;
  let textX = cx + angleCos * finalRadius + (isRight ? settings.textPadding : -settings.textPadding);
  let textY = cy + angleSin * finalRadius;
  
  return {
    startX: cx + angleCos * (finalRadius - settings.lineLength),
    startY: cy + angleSin * (finalRadius - settings.lineLength),
    textX: textX,
    textY: textY,
    align: isRight ? LEFT : RIGHT
  };
  }
  
  function mousePressed() {
  selectedIndex = -1;
  
  let dx = mouseX - currentCenterX;
  let dy = mouseY - currentCenterY;
  let distance = sqrt(dx * dx + dy * dy);
  let angle = atan2(dy, dx);
  if (angle < 0) angle += TWO_PI;
  
  for (let i = sectors.length - 1; i >= 0; i--) {
    let sector = sectors[i];
    if (angle >= sector.start && 
        angle <= sector.end && 
        distance <= sector.maxRadius) {
      selectedIndex = i;
      break;
    }
  }
  let prevSelection = selectedBubbleIndex;
  selectedBubbleIndex = -1;

  for (let i = bubbles.length-1; i >= 0; i--) {
    let b = bubbles[i];
    if (dist(mouseX, mouseY, b.x, b.y) < b.r) {
      selectedBubbleIndex = (i === prevSelection) ? -1 : i;
      break;
    }
  }
  checkRadialChartClick();
  }
  
function drawInfoPanel() {
  let index = selectedIndexMajor;
  
  const major = majors[index];
  const menCount = men[index];
  const womenCount = women[index];
  const total = menCount + womenCount;
  const womenPercentage = womenCount / total;
  const menPercentage = 1 - womenPercentage;

  const panelWidth = currentCenterX * 18 / 10;
  const panelHeight = 200;
  const panelX = (currentCenterX * 2 - panelWidth) / 2;
  const panelY = drawMainTitle();

  fill(0, 0, 0, 180);
  stroke(50);
  strokeWeight(1);
  rect(panelX, panelY, panelWidth, panelHeight, 10);

  selectMenu.style('font-size', '16px');
  selectMenu.style('background-color', '#333');
  selectMenu.style('color', 'white');
  selectMenu.style('border', '1px solid #E9BE93');
  selectMenu.style('border-radius', '5px');
  selectMenu.style('padding', '5px 5px');

  selectMenu.position( panelX + panelWidth - selectMenu.elt.offsetWidth, panelY + 5); 
  

  const shapeSize = map(width, 100, 4500, 5, 20);
  const shapesPerRow = 100;
  const maxShapes = 100;
  const baseY = panelY;

  const displayWomen = Math.round(womenPercentage * maxShapes);
  for (let i = 0; i < displayWomen; i++) {
    fill('#E9BE93');
    const x = panelX + 20 + (i % shapesPerRow) * (shapeSize + 4);
    const y = baseY + panelHeight * 1 / 5 + Math.floor(i / shapesPerRow) * (shapeSize + 8);
    rect(x, y, shapeSize, shapeSize);
  }
  fill(255);
  textSize(map(width, 500, 2500, 10, 12));
  textAlign(LEFT, CENTER);
  text('Women', panelX-20 , baseY + panelHeight * 1 / 5 );

  const displayMen = Math.round(menPercentage * maxShapes);
  for (let i = 0; i < displayMen; i++) {
    fill('#722E61');
    const x = panelX + 20 + (i % shapesPerRow) * (shapeSize + 4);
    const y = baseY + shapeSize + panelHeight * 2 / 5 + Math.floor(i / shapesPerRow) * (shapeSize + 8);
    rect(x, y, shapeSize, shapeSize);
  }
  fill(255);
  textSize(map(width, 500, 2500, 10, 12));
  textAlign(LEFT, CENTER);
  text('Men', panelX-10 , baseY + shapeSize + panelHeight * 2 / 5 );

  const barY = baseY + panelHeight * 0.75+10;
  const barHeight = 10;
  const barWidth = panelWidth - 40;
  const barStartX = panelX + 20;

  let gradient = drawingContext.createLinearGradient(
    barStartX, barY,
    barStartX + barWidth, barY
  );

  const softEdge = 0.005; 

  gradient.addColorStop(0, '#E9BE93');
  gradient.addColorStop(womenPercentage - softEdge, '#AE777A');

  gradient.addColorStop(womenPercentage, '#FFFFFF');

  gradient.addColorStop(womenPercentage + softEdge, '#AE777A');
  gradient.addColorStop(1, '#722E61');

  drawingContext.fillStyle = gradient;
  rect(barStartX, barY, barWidth, barHeight);

  fill(255);
  textSize(map(width, 500, 2500, 10, 15));
  textAlign(CENTER, CENTER);
  text(nf(womenPercentage * 100, 0, 1) + '% Women', panelX + panelWidth / 2, barY+5);

  fill(255);
  textSize(map(width, 500, 2500, 10, 14));
  textAlign(CENTER, CENTER);
  text('Man: ' + menCount + '   Woman: ' + womenCount+ '   Total: ' + total, panelX + panelWidth / 2, barY + 25);
}


function initBubbles() {
  bubbles = [];
  const bubbleChartHeight = 300;
  const bubbleChartY = drawMainTitle() *2+width+10;
  const clusterMarginX = 50;
  let majorCategories = table.getColumn("Major_category");
  let uniqueCategories = [...new Set(majorCategories)];
  let clusterWidth = (width - 2 * clusterMarginX) / uniqueCategories.length;
  
  let maxTotal = 0;
  for (let i = 0; i < table.getRowCount(); i++) {
    let tot = Number(table.getString(i, "Men")) + Number(table.getString(i, "Women"));
    if (tot > maxTotal) maxTotal = tot;
  }
  
  let minBubbleRadius = 10;  
  let maxBubbleRadius = 60;  
  
  for (let i = 0; i < uniqueCategories.length; i++) {
    let cat = uniqueCategories[i];
    let clusterX = clusterMarginX + i * clusterWidth;
    let clusterCenter = {
      x: clusterX + clusterWidth / 2,
      y: bubbleChartY + bubbleChartHeight / 2
    };
    
    for (let j = 0; j < table.getRowCount(); j++) {
      if (table.getString(j, "Major_category") === cat) {
        let tot = Number(table.getString(j, "Men")) + Number(table.getString(j, "Women"));
        let share = Number(table.getString(j, "ShareWomen"));
        let r = map(tot, 0, maxTotal, minBubbleRadius, maxBubbleRadius);
        let x = random(clusterX, clusterX + clusterWidth);
        let y = random(bubbleChartY, bubbleChartY + bubbleChartHeight);
        let vx = random(-1, 1);  
        let vy = random(-1, 1);  
        bubbles.push({
          x: x,
          y: y,
          vx: vx,
          vy: vy,
          r: r,
          major: table.getString(j, "Major"),
          womenShare: share,
          category: cat,
          target: clusterCenter 
        });
      }
    }
  }
}

function updateBubbles() {
  let dt = 1;
  let attractionStrength = 0.02;  
  let repulsionStrength = 0.3;    
  let damping = 0.98;             
  
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    let fx = (b.target.x - b.x) * attractionStrength;
    let fy = (b.target.y - b.y) * attractionStrength;
    
    for (let j = 0; j < bubbles.length; j++) {
      if (i === j) continue;
      let b2 = bubbles[j];
      if (b.category !== b2.category) continue;
      let dx = b.x - b2.x;
      let dy = b.y - b2.y;
      let dist = sqrt(dx * dx + dy * dy);
      let minDist = b.r + b2.r;
      if (dist < minDist && dist > 0) {
        let overlap = minDist - dist;
        fx += (dx / dist) * repulsionStrength * overlap;
        fy += (dy / dist) * repulsionStrength * overlap;
      }
    }
    
    b.vx = (b.vx + fx * dt) * damping;
    b.vy = (b.vy + fy * dt) * damping;
  }
  
  
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
}

function drawBubbles() {

  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    let bubbleColor = lerpColor(color('#FFC0CB'), color('#8B0000'), b.womenShare);
    noStroke();
    fill(bubbleColor);
    ellipse(b.x, b.y, b.r * 2);
  }

  bubbles.sort((a, b) => a.r - b.r); 
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    if (i !== selectedBubbleIndex) {
      drawSmartLabel(b);
    }
  }

  if (selectedBubbleIndex !== -1) {
    let b = bubbles[selectedBubbleIndex];
    push();
    stroke(255, 200);
    strokeWeight(2);
    fill(0);
    textSize(12);
    drawSmartLabel(b, true);
    pop();
  }
}

function drawSmartLabel(b, isSelected=false) {
  let labelPadding = 5;
  let labelX = b.x;
  let labelY = b.y + b.r + 15;
  
  let canDraw = true;
  for (let other of bubbles) {
    if (other === b) continue;
    let otherLabelY = other.y + other.r + 15;
    if (abs(labelY - otherLabelY) < 15 && 
        abs(labelX - other.x) < textWidth(b.major)/2 + textWidth(other.major)/2) {
      canDraw = false;
      break;
    }
  }

  if (canDraw || isSelected) {
    push();
    fill(255, isSelected ? 255 : 150);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(map(b.r, 10, 40, 8, 12));
    text(b.major, labelX, labelY);
    pop();
  }
}

function drawBubbleChart() {
  const bubbleChartHeight = 300;
  const bubbleChartY =drawMainTitle() *2+width+10;

  noStroke();
  fill(20);
  rect(0, bubbleChartY, width, bubbleChartHeight);
  
  let majorCategories = table.getColumn("Major_category");
  let uniqueCategories = [...new Set(majorCategories)];
  const clusterMarginX = 50;
  let clusterWidth = (width - 2 * clusterMarginX) / uniqueCategories.length;

  for (let i = 0; i < uniqueCategories.length; i++) {
    let cat = uniqueCategories[i];
    let clusterX = clusterMarginX + i * clusterWidth;
    let centerX = clusterX + clusterWidth / 2;
    fill(255);
    textSize(14);
    textAlign(CENTER, BOTTOM);
    text(cat, centerX, bubbleChartY + 20);  
  }
  
  if (bubblesAnimating) {
    updateBubbles();
    if (millis() - bubbleAnimationStartTime >= bubbleAnimationDuration) {
      bubblesAnimating = false;
      for (let i = 0; i < bubbles.length; i++) {
        bubbles[i].vx = 0;
        bubbles[i].vy = 0;
      }
    }
  }

  drawBubbles();
  drawBubbleLegend(bubbleChartY + bubbleChartHeight + 10);
}

function setupBubbleAnimationButton() {
  bubbleAnimationButton = createButton("Click to start viewing");
  bubbleAnimationButton.position(50,drawMainTitle() *2+width+50);
  bubbleAnimationButton.mousePressed(() => {
    initBubbles();
    bubblesAnimating = true;
    bubbleAnimationStartTime = millis();
  });
}
function drawBubbleLegend(legendY) {
  const legendX = width - 200;
  const legendWidth = 100;
  const legendHeight = 20;

  let gradient = drawingContext.createLinearGradient(
    legendX, legendY, 
    legendX + legendWidth, legendY
  );
  gradient.addColorStop(0, '#FFC0CB');
  gradient.addColorStop(1, '#8B0000');
  drawingContext.fillStyle = gradient;
  noStroke();
  rect(legendX, legendY, legendWidth, legendHeight);

  if (selectedBubbleIndex !== -1) {
    let share = bubbles[selectedBubbleIndex].womenShare * 100;
    fill(50);
    rect(legendX, legendY - 25, legendWidth, 20);
    fill(255);
    textAlign(CENTER, CENTER);
    text(nf(share, 0, 1) + "%", legendX + legendWidth/2, legendY - 15);
  }

  fill(255);
  textSize(8);
  textAlign(LEFT, TOP);
  text("0%", legendX, legendY + 5);
  textAlign(RIGHT, TOP);
  text("100%", legendX + legendWidth, legendY + 5);

  fill(255);
  textSize(15);
  textAlign(CENTER);
  text("Proportional Distribution of Women Across Professions", width/2, legendY +20);
}

function drawRadialStackedChart() {
  const cx = currentCenterX;
  const cy = currentCenterY; 
  radialMaxRadius = (min(currentCenterX, height - currentCenterY))*0.56
  /3;
  ringWidth = radialMaxRadius*0.5;
  const total = majors.length;
  const gap = radians(1.5); 
  const totalAngle = TWO_PI - gap * total;
  const angleStep = totalAngle / total;

  noStroke();
  
  for(let i=0; i<total; i++) {
    const start = i*(angleStep+gap) - HALF_PI;
    const end = start + angleStep;
    
    const menRatio = men[i]/(men[i]+women[i]);
    const womenRatio = 1 - menRatio;
    
    fill('#722E60');
    drawRingSegment(cx, cy, 
      radialMaxRadius,          
      radialMaxRadius - ringWidth * menRatio, 
      start, end
    );
    
    fill('#E8BE92');
    drawRingSegment(cx, cy,
      radialMaxRadius - ringWidth * menRatio, 
      ringInnerRadius,                       
      start, end
    );
  }
  
  fill('#10032C');
  ellipse(cx, cy, ringInnerRadius*2);
}

function drawRingSegment(x, y, outer, inner, start, end) {
  beginShape();
  for(let a=start; a<=end; a+=0.05){
    vertex(x + cos(a)*outer, y + sin(a)*outer);
  }
  for(let a=end; a>=start; a-=0.05){
    vertex(x + cos(a)*inner, y + sin(a)*inner);
  }
  endShape(CLOSE);
}

function checkRadialClick() {
  const dx = mouseX - width/2;
  const dy = mouseY - (height - 200);
  const dist = sqrt(dx*dx + dy*dy);
  
  if(dist < ringInnerRadius || dist > radialMaxRadius) return;
  
  const angle = (atan2(dy, dx) + TWO_PI) % TWO_PI; 
  const sectorWidth = TWO_PI/majors.length;
  
  selectedIndex = floor(angle / sectorWidth);
}

function drawInfoPanels() {
  const panelWidth = width/2 - 40;
  const panelHeight = 160;
  const margin = 20;
  let yPos = infoPanelsY;

  drawSinglePanel(
    "WHAT", 
    "• Percentage Panel: Displays the exact gender ratio and specific numbers of male and female students for a particular major.\n• ransformed Rose Chart: Provides an overall view of the number of students and gender distribution comparison across different majors.\n•Dynamic Bubble Heatmap: Helps quickly understand the female student proportion in different major categories and sub-majors.",
    margin, yPos, panelWidth, panelHeight, 0
  );
  
  drawSinglePanel(
    "HOW", 
    "• • Percentage Panel: Select a specific major by clicking the button, observe the number of male and female grids (representing percentages) and the gradient bar to understand the gender percentages and specific data for each major.\n•Transformed Rose Chart: View the overall gender and student numbers. Click to display the corresponding major label. The bar length represents total student numbers (processed by a logarithmic function) and is sorted by total student numbers. Color distribution contrasts gender ratios.Internal rings are columnar stacking maps of the male to female ratio\n•Dynamic Bubble Heatmap: Click to start the animation, observe the bubbles bounce and settle, with some major names randomly displayed. The bubble size represents the number of students in that major, and the bubble color represents the proportion of female students. Click on the bubble to view the major name.",
    width/2 + margin/2, yPos, panelWidth, panelHeight, 1
  );

  yPos += panelHeight + margin;
  
  drawSinglePanel(
    "WHO",
    "• STEM undergraduates\n• Academic advisors\n• Education policymakers",
    margin, yPos, panelWidth, panelHeight, 2
  );
  
  drawSinglePanel(
    "WHY", 
    "• Identifying Gender Differences: Gender differences in academic majors are the foundation for gender disparities in the professional field. Intuitive charts reveal the gender ratio differences within each major, helping people understand the gender distribution in various fields.\n• Data-Driven Choices: Multi-dimensional data displays make the scale and gender ratio of each major immediately clear, providing a basis for evaluating future academic and employment environments.\n• Self-Awareness and Planning: The data serves not only as a reference for students but also provides evidence to schools and policymakers for promoting inclusive development in STEM education.\n",
    width/2 + margin/2, yPos, panelWidth, panelHeight, 3
  );
}

function drawSinglePanel(title, content, x, y, w, h, colorIndex) {

  fill(30, 30, 30, 200);
  stroke(100);
  rect(x, y, w, h, 10);
  
  fill(panelColors[colorIndex % 4]);
  noStroke();
  rect(x, y, w*0.25, h, 10, 0, 0, 10);
  
  push();
  textSize(18);
  fill(255);
  textAlign(CENTER, CENTER);
  text(title, x + w*0.125, y + h/2);
  
  textSize(14);
  textAlign(LEFT, TOP);
  fill(200);
  text(content, x + w*0.3, y + 20, w*0.65, h-30);
  pop();
}



