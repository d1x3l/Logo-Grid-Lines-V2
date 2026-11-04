/////////////////////////////////////////////////////////////////
//
// Adobe Illustrator : Logo Grid & Blueprint Generator
// v4.1 (Fix: Testo Checkbox Completo)
//
// Basato sul codice originale di Studio Gibbous (www.studiogibbous.com)
// Esteso con interfaccia ScriptUI, gestione maniglie Bezier e gruppi di livelli.
//
/////////////////////////////////////////////////////////////////

(function () {
  if (app.documents.length === 0) {
    alert("Nessun documento aperto. Apri un documento e seleziona un elemento.");
    return;
  }

  var doc = app.activeDocument;
  var selection = doc.selection;
  var isCMYK = (doc.documentColorSpace === DocumentColorSpace.CMYK);

  if (!selection || selection.length === 0) {
    alert("Seleziona uno o più elementi prima di eseguire lo script.");
    return;
  }

  // --- HELPER: Creazione Colore ---
  function createColor(r, g, b, c, m, y, k) {
    if (isCMYK) {
      var color = new CMYKColor();
      color.cyan = c; color.magenta = m; color.yellow = y; color.black = k;
      return color;
    } else {
      var color = new RGBColor();
      color.red = r; color.green = g; color.blue = b;
      return color;
    }
  }

  // =================================================================
  // FINESTRA SECONDARIA: IMPOSTAZIONI AVANZATE (TABBED LAYOUT)
  // =================================================================
  function showAdvancedDialog(settings) {
    var advWin = new Window("dialog", "Impostazioni Avanzate");
    advWin.orientation = "column";
    advWin.alignChildren = ["fill", "fill"];
    advWin.spacing = 15;
    advWin.margins = 18;

    // Pannello a Schede (Tabs)
    var tpanel = advWin.add("tabbedpanel");
    tpanel.alignChildren = ["fill", "fill"];

    // ---------------------------------------------------
    // TAB 1: PARAMETRI E SENSIBILITÀ
    // ---------------------------------------------------
    var tabDim = tpanel.add("tab", undefined, "Parametri Geometrici");
    tabDim.orientation = "column";
    tabDim.alignChildren = ["fill", "top"];
    tabDim.spacing = 15;
    tabDim.margins = 15;

    // Helper: Riga Input con pulsanti +/-
    function addSpinEdit(parent, labelText, defaultValue, unit, step) {
      var row = parent.add("group");
      row.orientation = "row";
      row.alignChildren = ["left", "center"];
      
      var lbl = row.add("statictext", undefined, labelText);
      lbl.preferredSize.width = 145;
      lbl.justify = "right";

      var grpSpin = row.add("group");
      grpSpin.spacing = 3;

      var btnMinus = grpSpin.add("button", undefined, "-");
      btnMinus.preferredSize = [24, 24];

      var txt = grpSpin.add("edittext", undefined, String(defaultValue) + " " + unit);
      txt.characters = 7;
      txt.justify = "center";

      var btnPlus = grpSpin.add("button", undefined, "+");
      btnPlus.preferredSize = [24, 24];

      function getVal() { return parseFloat(txt.text.replace(/[^\d.-]/g, '')) || 0; }
      function setVal(v) {
        v = Math.round(v * 100) / 100; // Arrotonda
        txt.text = v + " " + unit; 
      }

      btnMinus.onClick = function() { setVal(Math.max(0, getVal() - step)); };
      btnPlus.onClick = function() { setVal(getVal() + step); };

      row.getValue = getVal;
      return row;
    }

    var grpDim = tabDim.add("group");
    grpDim.orientation = "column";
    grpDim.alignChildren = ["fill", "top"];
    grpDim.spacing = 8;
    var rowAnchorSize = addSpinEdit(grpDim, "Dimensione ancore:", settings.anchorSize, "px", 1);
    var rowHandleSize = addSpinEdit(grpDim, "Raggio maniglie:", settings.handleSize, "px", 0.5);
    var rowStrokeWidth = addSpinEdit(grpDim, "Spessore tratto:", settings.strokeWidth, "pt", 0.25);

    // Divisore
    var div1 = tabDim.add("panel");
    div1.alignment = "fill";
    div1.preferredSize.height = 2;

    var grpSens = tabDim.add("group");
    grpSens.orientation = "column";
    grpSens.alignChildren = ["fill", "top"];
    grpSens.spacing = 8;
    var rowMinLineLength = addSpinEdit(grpSens, "Lunghezza min. linee:", settings.minLineLength, "px", 1);
    var rowArcTolerance = addSpinEdit(grpSens, "Tolleranza curve/archi:", settings.arcTolerance, "%", 1);

    // ---------------------------------------------------
    // TAB 2: COLORI
    // ---------------------------------------------------
    var tabCol = tpanel.add("tab", undefined, "Gestione Colori");
    tabCol.orientation = "column";
    tabCol.alignChildren = ["fill", "top"];
    tabCol.spacing = 10;
    tabCol.margins = 15;

    var lblColorsInfo = tabCol.add("statictext", undefined, "Clicca sul riquadro per aprire il selettore colore nativo.");
    lblColorsInfo.alignment = "center";
    lblColorsInfo.graphics.foregroundColor = lblColorsInfo.graphics.newPen(lblColorsInfo.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.5, 1], 1);
    
    var div2 = tabCol.add("panel");
    div2.alignment = "fill";
    div2.preferredSize.height = 2;

    var grpColors = tabCol.add("group");
    grpColors.orientation = "column";
    grpColors.alignChildren = ["center", "top"];
    grpColors.spacing = 12;

    function addColorRow(parent, labelText, colorObj) {
      var row = parent.add("group");
      row.orientation = "row";
      row.alignChildren = ["left", "center"];
      
      var lbl = row.add("statictext", undefined, labelText);
      lbl.preferredSize.width = 110;
      lbl.justify = "right";

      var btnColor = row.add("button", undefined, "");
      btnColor.preferredSize = [40, 24];
      btnColor.colorObj = colorObj;

      btnColor.onDraw = function() {
        var gfx = this.graphics;
        var r = 0, g = 0, b = 0;
        
        if (this.colorObj.typename === "CMYKColor") {
          var c = this.colorObj.cyan / 100, m = this.colorObj.magenta / 100, y = this.colorObj.yellow / 100, k = this.colorObj.black / 100;
          r = 255 * (1 - c) * (1 - k); g = 255 * (1 - m) * (1 - k); b = 255 * (1 - y) * (1 - k);
        } else {
          r = this.colorObj.red; g = this.colorObj.green; b = this.colorObj.blue;
        }

        var brush = gfx.newBrush(gfx.BrushType.SOLID_COLOR, [r/255, g/255, b/255, 1]);
        gfx.newPath();
        gfx.rectPath(0, 0, this.preferredSize.width, this.preferredSize.height);
        gfx.fillPath(brush);
        var pen = gfx.newPen(gfx.PenType.SOLID_COLOR, [0.3, 0.3, 0.3, 1], 1);
        gfx.strokePath(pen);
      };

      btnColor.onClick = function() {
        var newColor = app.showColorPicker(this.colorObj);
        if (newColor) {
          this.colorObj = newColor;
          this.hide(); this.show();
        }
      };
      
      row.getColor = function() { return btnColor.colorObj; };
      return row;
    }

    var rowColorLines = addColorRow(grpColors, "Tracciati base:", settings.colorLines);
    var rowColorArcs = addColorRow(grpColors, "Cerchi e Archi:", settings.colorArcs);
    var rowColorPoints = addColorRow(grpColors, "Punti Ancoraggio:", settings.colorPoints);
    var rowColorHandles = addColorRow(grpColors, "Maniglie di Controllo:", settings.colorHandles);

    // --- PULSANTI BOTTOM ADVANCED ---
    var grpBtns = advWin.add("group");
    grpBtns.orientation = "row";
    grpBtns.alignment = ["right", "bottom"];
    grpBtns.spacing = 10;

    var btnCancel = grpBtns.add("button", undefined, "Annulla", { name: "cancel" });
    var btnSave = grpBtns.add("button", undefined, "Applica", { name: "ok" });

    if (advWin.show() === 1) {
      settings.anchorSize = rowAnchorSize.getValue();
      settings.handleSize = rowHandleSize.getValue();
      settings.strokeWidth = rowStrokeWidth.getValue();
      settings.minLineLength = rowMinLineLength.getValue();
      settings.arcTolerance = rowArcTolerance.getValue();
      
      settings.colorLines = rowColorLines.getColor();
      settings.colorArcs = rowColorArcs.getColor();
      settings.colorPoints = rowColorPoints.getColor();
      settings.colorHandles = rowColorHandles.getColor();
    }
  }

  // =================================================================
  // INTERFACCIA PRINCIPALE
  // =================================================================
  function showDialog() {
    var advSettings = {
      anchorSize: 6,
      handleSize: 2.5,
      strokeWidth: 0.5,
      minLineLength: 3,
      arcTolerance: 15,
      colorLines: createColor(0,0,0, 0,0,0,100),       // Nero
      colorArcs: createColor(0,0,0, 0,0,0,100),        // Nero
      colorPoints: createColor(0,0,0, 0,0,0,100),      // Nero
      colorHandles: createColor(0,122,255, 85,50,0,0)  // Blu
    };

    var win = new Window("dialog", "Logo Blueprint Generator");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 15;
    win.margins = 20;

    // Header Testo
    var grpHeader = win.add("group");
    grpHeader.orientation = "column";
    grpHeader.alignChildren = ["left", "center"];
    grpHeader.spacing = 2;
    var title = grpHeader.add("statictext", undefined, "Costruzione Griglia Elementi");
    title.graphics.font = ScriptUI.newFont("dialog", "BOLD", 13);
    var subtitle = grpHeader.add("statictext", undefined, "Seleziona i dettagli costruttivi da estrarre ed evidenziare:");
    
    // Griglia Spunte (2x2 Layout)
    var pnlElements = win.add("panel", undefined, "");
    pnlElements.margins = 18;
    
    var gridChecks = pnlElements.add("group");
    gridChecks.orientation = "row";
    gridChecks.alignChildren = ["fill", "top"];
    gridChecks.spacing = 20;

    var col1 = gridChecks.add("group");
    col1.orientation = "column";
    col1.alignChildren = ["left", "center"];
    col1.spacing = 12;
    var chkLines = col1.add("checkbox", undefined, " Linee di struttura"); 
    chkLines.preferredSize.width = 160; 
    chkLines.value = true;
    var chkArcs = col1.add("checkbox", undefined, " Cerchi e tolleranze"); 
    chkArcs.preferredSize.width = 160; 
    chkArcs.value = true;

    var col2 = gridChecks.add("group");
    col2.orientation = "column";
    col2.alignChildren = ["left", "center"];
    col2.spacing = 12;
    var chkPoints = col2.add("checkbox", undefined, " Punti di ancoraggio"); 
    chkPoints.preferredSize.width = 160; 
    chkPoints.value = true;
    var chkHandles = col2.add("checkbox", undefined, " Maniglie di Bezier"); 
    chkHandles.preferredSize.width = 160; 
    chkHandles.value = true;

    // Divisore Inferiore
    var divMain = win.add("panel");
    divMain.alignment = "fill";
    divMain.preferredSize.height = 2;

    // --- BARRA INFERIORE (Layout Moderno stile Adobe) ---
    var grpBottom = win.add("group");
    grpBottom.orientation = "row";
    grpBottom.alignChildren = ["fill", "center"];
    grpBottom.alignment = ["fill", "bottom"];

    // Bottone Impostazioni a sinistra
    var btnAdvanced = grpBottom.add("button", undefined, "Impostazioni Avanzate...");
    btnAdvanced.alignment = ["left", "center"];
    btnAdvanced.onClick = function () { showAdvancedDialog(advSettings); };

    // Bottoni Genera/Annulla a destra
    var grpActions = grpBottom.add("group");
    grpActions.orientation = "row";
    grpActions.alignment = ["right", "center"];
    grpActions.spacing = 10;
    var btnCancel = grpActions.add("button", undefined, "Annulla", { name: "cancel" });
    var btnOk = grpActions.add("button", undefined, "Genera", { name: "ok" });

    if (win.show() === 1) {
      return {
        lines: chkLines.value,
        arcs: chkArcs.value,
        points: chkPoints.value,
        handles: chkHandles.value,
        anchorSize: advSettings.anchorSize,
        handleSize: advSettings.handleSize,
        strokeWidth: advSettings.strokeWidth,
        minLineLength: advSettings.minLineLength,
        arcTolerance: advSettings.arcTolerance,
        colorLines: advSettings.colorLines,
        colorArcs: advSettings.colorArcs,
        colorPoints: advSettings.colorPoints,
        colorHandles: advSettings.colorHandles
      };
    }
    return null;
  }

  // =================================================================
  // ESECUZIONE PRINCIPALE
  // =================================================================
  function runGenerator() {
    var options = showDialog();
    if (!options) return;

    var colorWhite = isCMYK ? new CMYKColor() : new RGBColor();
    if (isCMYK) {
        colorWhite.cyan = 0; colorWhite.magenta = 0; colorWhite.yellow = 0; colorWhite.black = 0;
    } else {
        colorWhite.red = 255; colorWhite.green = 255; colorWhite.blue = 255;
    }

    var colorLines = options.colorLines;
    var colorArcs = options.colorArcs;
    var colorPoints = options.colorPoints;
    var colorHandles = options.colorHandles;

    function getOrCreateLayer(name) {
      var l;
      try { l = doc.layers.getByName(name); } 
      catch (e) { l = doc.layers.add(); l.name = name; }
      l.locked = false; l.visible = true;
      return l;
    }

    function getOrCreateSubLayer(parentLayer, name) {
      var sl;
      try { sl = parentLayer.layers.getByName(name); } 
      catch (e) { sl = parentLayer.layers.add(); sl.name = name; }
      sl.locked = false; sl.visible = true;
      return sl;
    }

    function arePointsEqual(p1, p2, tolerance) {
      tolerance = tolerance || 0.001;
      return Math.abs(p1[0] - p2[0]) < tolerance && Math.abs(p1[1] - p2[1]) < tolerance;
    }

    function getDistance(p1, p2) {
      return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    }

    function areLinesParallel(line1, line2, angleTolerance) {
      angleTolerance = angleTolerance || 2;
      var dx1 = line1[1][0] - line1[0][0], dy1 = line1[1][1] - line1[0][1];
      var dx2 = line2[1][0] - line2[0][0], dy2 = line2[1][1] - line2[0][1];
      var angle1 = (Math.atan2(dy1, dx1) * 180) / Math.PI;
      var angle2 = (Math.atan2(dy2, dx2) * 180) / Math.PI;
      angle1 = (angle1 % 180 + 180) % 180;
      angle2 = (angle2 % 180 + 180) % 180;
      var angleDiff = Math.abs(angle1 - angle2);
      return angleDiff <= angleTolerance || angleDiff >= (180 - angleTolerance);
    }

    function areLinesEqual(line1, line2) {
      var positionTolerance = 1, angleTolerance = 2;
      if (
        (arePointsEqual(line1[0], line2[0], positionTolerance) && arePointsEqual(line1[1], line2[1], positionTolerance)) ||
        (arePointsEqual(line1[0], line2[1], positionTolerance) && arePointsEqual(line1[1], line2[0], positionTolerance))
      ) {
        return true;
      }
      if (areLinesParallel(line1, line2, angleTolerance)) {
        var x0 = line1[0][0], y0 = line1[0][1];
        var x1 = line2[0][0], y1 = line2[0][1];
        var x2 = line2[1][0], y2 = line2[1][1];
        var len2 = getDistance([x1, y1], [x2, y2]);
        if (len2 < 0.001) return false;
        var distance = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / len2;
        return distance < (positionTolerance * 5);
      }
      return false;
    }

    function calculateCircleFromThreePoints(p1, p2, p3) {
      var x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1], x3 = p3[0], y3 = p3[1];
      var d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
      if (Math.abs(d) < 0.001) return null;
      var ux = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / d;
      var uy = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / d;
      return { center: [ux, uy], radius: getDistance([ux, uy], p1) };
    }

    function areCirclesOverlapping(circle1, circle2, tolerance) {
      tolerance = tolerance || 0.05;
      var centerDistance = getDistance(circle1.center, circle2.center);
      var radiusDiff = Math.abs(circle1.radius - circle2.radius);
      var avgRadius = (circle1.radius + circle2.radius) / 2;
      if (circle1.sourceItem && circle2.sourceItem && circle1.sourceItem !== circle2.sourceItem) {
        tolerance = tolerance * 0.3;
      }
      var isConcentricish = centerDistance < avgRadius * tolerance;
      var isSimilarSize = radiusDiff < avgRadius * tolerance;
      var isContained = centerDistance + Math.min(circle1.radius, circle2.radius) < Math.max(circle1.radius, circle2.radius) * (1 + tolerance);
      return (isConcentricish && isSimilarSize) || isContained;
    }

    function consolidateOverlappingCircles(circles) {
      var consolidated = [], processed = [];
      for (var i = 0; i < circles.length; i++) {
        if (processed[i]) continue;
        var group = [circles[i]];
        processed[i] = true;
        for (var j = i + 1; j < circles.length; j++) {
          if (processed[j]) continue;
          if (areCirclesOverlapping(circles[i], circles[j])) {
            group.push(circles[j]);
            processed[j] = true;
          }
        }
        group.sort(function (a, b) { return a.radius - b.radius; });
        consolidated.push(group[Math.floor(group.length / 2)]);
      }
      return consolidated;
    }

    function isSegmentCurved(pathPoint, nextPathPoint) {
      var hasRight = !arePointsEqual(pathPoint.anchor, pathPoint.rightDirection);
      var hasLeft = !arePointsEqual(nextPathPoint.anchor, nextPathPoint.leftDirection);
      return hasRight || hasLeft;
    }

    function getPointsOnCurvedSegment(pathPoint, nextPathPoint, numSamples) {
      numSamples = numSamples || 4;
      var points = [];
      var p0 = pathPoint.anchor, p1 = pathPoint.rightDirection;
      var p2 = nextPathPoint.leftDirection, p3 = nextPathPoint.anchor;
      for (var i = 0; i <= numSamples; i++) {
        var t = i / numSamples;
        var x = Math.pow(1 - t, 3) * p0[0] + 3 * Math.pow(1 - t, 2) * t * p1[0] + 3 * (1 - t) * Math.pow(t, 2) * p2[0] + Math.pow(t, 3) * p3[0];
        var y = Math.pow(1 - t, 3) * p0[1] + 3 * Math.pow(1 - t, 2) * t * p1[1] + 3 * (1 - t) * Math.pow(t, 2) * p2[1] + Math.pow(t, 3) * p3[1];
        points.push([x, y]);
      }
      return points;
    }

    function detectCirclesFromCurvedSegments(item, detectedCircles, sourceItemId) {
      var points = item.pathPoints;
      if (!points || points.length <= 1) return;
      var tolRatio = options.arcTolerance / 100;

      for (var j = 0; j < points.length; j++) {
        var cur = points[j];
        var next = points[(j + 1) % points.length];
        if (isSegmentCurved(cur, next)) {
          var curvePts = getPointsOnCurvedSegment(cur, next, 4);
          var circle = calculateCircleFromThreePoints(curvePts[0], curvePts[2], curvePts[4]);
          if (circle && circle.radius >= 8 && circle.radius <= 1500) {
            var r1 = getDistance(circle.center, curvePts[1]);
            var r3 = getDistance(circle.center, curvePts[3]);
            var maxDev = Math.max(Math.abs(r1 - circle.radius), Math.abs(r3 - circle.radius));
            if (maxDev < circle.radius * tolRatio) {
              circle.sourceItem = sourceItemId;
              detectedCircles.push(circle);
            }
          }
        }
      }
    }

    function getArtboardIntersections(startX, startY, dx, dy) {
      var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
      var rect = artboard.artboardRect;
      var x1 = rect[0], y1 = rect[1], x2 = rect[2], y2 = rect[3];
      var minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      var minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
      var intersections = [];

      if (Math.abs(dx) > 0.0001) {
        var t1 = (minX - startX) / dx, t2 = (maxX - startX) / dx;
        var yAtX1 = startY + t1 * dy, yAtX2 = startY + t2 * dy;
        if (yAtX1 >= minY && yAtX1 <= maxY) intersections.push([minX, yAtX1]);
        if (yAtX2 >= minY && yAtX2 <= maxY) intersections.push([maxX, yAtX2]);
      }
      if (Math.abs(dy) > 0.0001) {
        var t3 = (minY - startY) / dy, t4 = (maxY - startY) / dy;
        var xAtY1 = startX + t3 * dx, xAtY2 = startX + t4 * dx;
        if (xAtY1 >= minX && xAtY1 <= maxX) intersections.push([xAtY1, minY]);
        if (xAtY2 >= minX && xAtY2 <= maxX) intersections.push([xAtY2, maxY]);
      }
      return intersections;
    }

    function extendAcrossArtboard(startX, startY, endX, endY, layer, existingLines) {
      var dx = endX - startX, dy = endY - startY;
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;
      var intersections = getArtboardIntersections(startX, startY, dx, dy);
      if (intersections.length >= 2) {
        intersections.sort(function (a, b) {
          return getDistance([startX, startY], a) - getDistance([startX, startY], b);
        });
        var p1 = intersections[0], p2 = intersections[intersections.length - 1];
        var newLine = [p1, p2];
        for (var i = 0; i < existingLines.length; i++) {
          if (areLinesEqual(newLine, existingLines[i])) return;
        }
        existingLines.push(newLine);
        var line = layer.pathItems.add();
        line.setEntirePath(newLine);
        line.stroked = true;
        line.strokeWidth = options.strokeWidth;
        line.strokeColor = colorLines;
        line.filled = false;
      }
    }

    function processPathItem(item, layer, existingLines) {
      var points = item.pathPoints;
      if (!points) return;
      for (var j = 0; j < points.length; j++) {
        var p1 = points[j], p2 = points[(j + 1) % points.length];
        if (getDistance(p1.anchor, p2.anchor) >= options.minLineLength && !isSegmentCurved(p1, p2)) {
          extendAcrossArtboard(p1.anchor[0], p1.anchor[1], p2.anchor[0], p2.anchor[1], layer, existingLines);
        }
      }
    }

    function processGroupItem(item, layer, existingLines) {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) processGroupItem(item.pageItems[i], layer, existingLines);
      } else if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) processPathItem(item.pathItems[j], layer, existingLines);
      } else if (item.typename === "PathItem") {
        processPathItem(item, layer, existingLines);
      }
    }

    function processGroupItemForArcs(item, detectedCircles, sourceId) {
      if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) processGroupItemForArcs(item.pageItems[i], detectedCircles, sourceId + "_" + i);
      } else if (item.typename === "CompoundPathItem") {
        for (var j = 0; j < item.pathItems.length; j++) detectCirclesFromCurvedSegments(item.pathItems[j], detectedCircles, sourceId + "_" + j);
      } else if (item.typename === "PathItem") {
        detectCirclesFromCurvedSegments(item, detectedCircles, sourceId);
      }
    }

    function renderAnchorsAndHandles(item, ptsLayer, hndLayer) {
      if (item.typename === "PathItem") {
        var pts = item.pathPoints;
        var halfSquare = options.anchorSize / 2;

        for (var j = 0; j < pts.length; j++) {
          var pp = pts[j];
          var anchor = pp.anchor;

          if (options.points && ptsLayer) {
            var sq = ptsLayer.pathItems.rectangle(anchor[1] + halfSquare, anchor[0] - halfSquare, options.anchorSize, options.anchorSize);
            sq.fillColor = colorWhite;
            sq.strokeColor = colorPoints;
            sq.strokeWidth = options.strokeWidth;
          }

          if (options.handles && hndLayer) {
            var dirs = [pp.leftDirection, pp.rightDirection];
            for (var d = 0; d < dirs.length; d++) {
              var dir = dirs[d];
              if (!arePointsEqual(anchor, dir, 0.5)) {
                var hLine = hndLayer.pathItems.add();
                hLine.setEntirePath([anchor, dir]);
                hLine.stroked = true;
                hLine.strokeWidth = options.strokeWidth * 0.7;
                hLine.strokeColor = colorHandles;
                hLine.filled = false;

                var hDot = hndLayer.pathItems.ellipse(dir[1] + options.handleSize, dir[0] - options.handleSize, options.handleSize * 2, options.handleSize * 2);
                hDot.fillColor = colorWhite;
                hDot.strokeColor = colorHandles;
                hDot.strokeWidth = options.strokeWidth * 0.7;
              }
            }
          }
        }
      } else if (item.typename === "GroupItem") {
        for (var i = 0; i < item.pageItems.length; i++) renderAnchorsAndHandles(item.pageItems[i], ptsLayer, hndLayer);
      } else if (item.typename === "CompoundPathItem") {
        for (var k = 0; k < item.pathItems.length; k++) renderAnchorsAndHandles(item.pathItems[k], ptsLayer, hndLayer);
      }
    }

    var mainLayer = getOrCreateLayer("Logo Grid");
    var linesLayer = options.lines ? getOrCreateSubLayer(mainLayer, "Guidelines") : null;
    var arcsLayer = options.arcs ? getOrCreateSubLayer(mainLayer, "Arcs") : null;
    var handlesLayer = options.handles ? getOrCreateSubLayer(mainLayer, "Handles") : null;
    var pointsLayer = options.points ? getOrCreateSubLayer(mainLayer, "Points") : null;

    var existingLines = [];
    var allCircles = [];

    for (var i = 0; i < selection.length; i++) {
      var curr = selection[i];

      if (options.lines) processGroupItem(curr, linesLayer, existingLines);

      if (options.arcs) {
        var itemCircles = [];
        processGroupItemForArcs(curr, itemCircles, "item_" + i);
        var consolidated = consolidateOverlappingCircles(itemCircles);
        for (var c = 0; c < consolidated.length; c++) allCircles.push(consolidated[c]);
      }

      renderAnchorsAndHandles(curr, pointsLayer, handlesLayer);
    }

    if (options.arcs && arcsLayer) {
      for (var a = 0; a < allCircles.length; a++) {
        var circ = allCircles[a];
        var ellipse = arcsLayer.pathItems.ellipse(
          circ.center[1] + circ.radius,
          circ.center[0] - circ.radius,
          circ.radius * 2,
          circ.radius * 2
        );
        ellipse.stroked = true;
        ellipse.strokeWidth = options.strokeWidth;
        ellipse.strokeColor = colorArcs;
        ellipse.filled = false;
      }
    }
  }

  runGenerator();
})();