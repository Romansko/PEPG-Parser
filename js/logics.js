/// PE & PG Parser made by Roman Koifman (c) 2018.



/************************** MAIN **************************/
var cpuTypeSet, modeSet, pgSizeSet;
var bX32, bX64;
var bCompMode, bLongMode, bSysManagMode;
var b4K, b2M, b1G;
const HEX = 16, DEC = 10, BIN = 2, ERR = -1;
var prevLinearBase = HEX, prevPhysicalBase = HEX; 
const X32MODE = 0, X64LONG4K = 1, X64LONG2M = 2, X64LONG1G = 3, X64COMP = 4;
var pt="?", ptVal="?", pd="?", pdVal="?", pdp="?", pdpVal="?", pml4="?", pml4Val="?";
var frame = 0, offset = 0;
/***/

/**
 * On page loaded
 */
$(document).ready(function(){
    
    // cpu set
    cpuTypeSet = document.getElementById("cpuset");
    bX32 = cpuTypeSet.elements[0];
    bX64 = cpuTypeSet.elements[1];
    $("#x32").change(x32Checked);
    $("#x64").change(x64Checked);
    $("#k4").change(drawCanvas);
    $("#m2").change(drawCanvas);
    $("#g1").change(drawCanvas);
 
    // mode set
    modeSet = document.getElementById("modeset");
    bCompMode = modeSet.elements[0];
    bLongMode = modeSet.elements[1];
    bSysManagMode = modeSet.elements[2];

    // paging related
    $("#pg").change(pgHandler);
    pgSizeSet = document.getElementById("pgsize");
    b4K = pgSizeSet.elements[0];
    b2M = pgSizeSet.elements[1];
    b1G = pgSizeSet.elements[2];

    
    // linear address
    $("#linearAddressTextBox").keydown(function(e){
        preventType(prevLinearBase, e);
    });
    $("#linearAddressTextBox").on("change paste keyup", parseAddress);
    $("#linearAddrrHex").change(function() {
        $("#linearAddressTextBox").val(convertNumber($("#linearAddressTextBox").val(), prevLinearBase, 16));
        prevLinearBase = HEX;
    });
    $("#linearAddrrDec").change(function() {
        $("#linearAddressTextBox").val(convertNumber($("#linearAddressTextBox").val(), prevLinearBase, 10));
        prevLinearBase = DEC;
    });
    $("#linearAddrrBin").change(function() {
        $("#linearAddressTextBox").val(convertNumber($("#linearAddressTextBox").val(), prevLinearBase, 2));
        prevLinearBase = BIN;
    });

    // physical address
    $("#physicalAddressTextBox").keydown(function(e){
        preventType(prevPhysicalBase, e);
    });
    $("#physicalAddressTextBox").on("change paste keyup",parseAddress);
    $("#physicalAddrrHex").change(function() {
        $("#physicalAddressTextBox").val(convertNumber($("#physicalAddressTextBox").val(), prevPhysicalBase, 16));
        prevPhysicalBase = HEX;
    });
    $("#physicalAddrrDec").change(function() {
        $("#physicalAddressTextBox").val(convertNumber($("#physicalAddressTextBox").val(), prevPhysicalBase, 10));
        prevPhysicalBase = DEC;
    });
    $("#physicalAddrrBin").change(function() {
        $("#physicalAddressTextBox").val(convertNumber($("#physicalAddressTextBox").val(), prevPhysicalBase, 2));
        prevPhysicalBase = BIN;
    });

    $("#clearAll").click(function(){
        $("#linearAddressTextBox").val("");
        $("#physicalAddressTextBox").val("");
        $("#data").text(null);
    });
    $("#linClear").click(function(){
        $("#linearAddressTextBox").val("");
    });
    $("#phyClear").click(function(){
        $("#physicalAddressTextBox").val("");
    });
    $("#pgsize").change(parseAddress);

    $("#hover").mouseenter(calcData);
    drawCanvas(X32MODE);
    
});


function disableLinearAdress(toDisable){
    const txt = "Paging disabled. Linear address = Physical address.";
    if (toDisable){
        $("#linearAddressTextBox").val(txt);
        $("#physicalAddressTextBox").val(txt);
    } 
    else{ 
        if( $("#linearAddressTextBox").val() === txt)
            $("#linearAddressTextBox").val("");
        if( $("#physicalAddressTextBox").val() === txt)
            $("#physicalAddressTextBox").val("");  
    }
    $("#physicalAddressTextBox").prop( "disabled", toDisable );
    $("#physicalAddrrHex").prop( "disabled", toDisable );
    $("#physicalAddrrDec").prop( "disabled", toDisable );
    $("#physicalAddrrBin").prop( "disabled", toDisable );
    $("#physicalClear").prop( "disabled", toDisable );
    $("#phyClear").prop( "disabled", toDisable );
    $("#linearAddressTextBox").prop( "disabled", toDisable );
    $("#linearAddrrHex").prop( "disabled", toDisable );
    $("#linearAddrrDec").prop( "disabled", toDisable );
    $("#linearAddrrBin").prop( "disabled", toDisable );
    $("#linClear").prop( "disabled", toDisable );
}


function preventType(Base, e) {
    var basicSet = [48, 49, 96, 97, 8, 35, 36, 37, 38, 39, 40, 46, 16, 20];
    if (Base === BIN) {
        if (!basicSet.includes(e.keyCode))
            e.preventDefault();
    }
    if (Base === DEC) {
        if (!basicSet.includes(e.keyCode) &&
            !((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)))
            e.preventDefault(); 
    }
    if (Base === HEX) {
        if (!basicSet.includes(e.keyCode) && 
            !((e.keyCode >= 48 && e.keyCode <= 70) || (e.keyCode >= 96 && e.keyCode <= 105)))
            e.preventDefault(); 
    }
}

/**
 * convert number base
 * @param {*} numStr num to convert
 * @param {*} fromBase 
 * @param {*} toBase 
 */
function convertNumber(numStr, fromBase, toBase) {
    if (numStr === "") return 0;
    try{
        var num = bigInt(numStr, fromBase);
        return num.toString(toBase);
    }
    catch(e){
        return ("Failed to read invalid base("+fromBase+") value.");
    }
  }

function x32Checked() {
    for (var i=0; i<modeSet.elements.length; ++i) {
        modeSet.elements[i].disabled = true;
        modeSet.elements[i].checked = false;
    }
    pgHandler();
}

function x64Checked() {
    /*for (var i=0; i<modeSet.elements.length; ++i)
        modeSet.elements[i].disabled = false;*/
    bLongMode.checked = true;
    pgHandler();
}

function pgHandler() {
    if ($("#pg").prop("checked")){
        for (var i=0; i<pgSizeSet.elements.length; ++i)
            pgSizeSet.elements[i].disabled = false;
        b4K.checked = true;
        if (bX32.checked){
            b2M.disabled = true;
            b1G.disabled = true;
        }
        disableLinearAdress(false);
        drawCanvas();
    }
    else {
        for (var i=0; i<pgSizeSet.elements.length; ++i) {
            pgSizeSet.elements[i].disabled = true;
            pgSizeSet.elements[i].checked = false;
        }
        disableLinearAdress(true);
        $("#data").text(null);
        $('canvas').clearCanvas();
    }
}

function parseAddress() {
    const x32Offset =  Math.pow(2,12), x32Table = Math.pow(2,10), x64Table = Math.pow(2,9); 
    const lFrameBits = Math.pow(2, 20);
    const pFrameBits = Math.pow(2, 40);
    var physicalA, linearA, frameData;
    pt="?"; ptVal="?"; pd="?"; pdVal="?"; pdp="?"; pdpVal="?"; pml4="?"; pml4Val="?";
    frame = 0; offset = 0;
    var gotL = false, gotP = false;
    if ($("#physicalAddressTextBox").val() !== "") {
        physicalA = bigInt($("#physicalAddressTextBox").val(), prevPhysicalBase);
        gotP = true;
    }
    if ($("#linearAddressTextBox").val() !== "") {
        linearA = bigInt($("#linearAddressTextBox").val(), prevLinearBase);
        gotL = true;
    }
        
    
    /**
     * x32 mode
     */
    if ($("#x32").prop("checked")) {   // x32 mode
        /* parse linear */
        if (gotL) {
            offset = linearA.mod(x32Offset).toJSNumber();
            linearA = linearA.divide(x32Offset);
            pt = linearA.mod(x32Table).toJSNumber();
            linearA = linearA.divide(x32Table);
            pd = linearA.mod(x32Table).toJSNumber();
        }
        if (gotP) {
            frameData = physicalA.mod(x32Offset).toJSNumber();
            physicalA = physicalA.divide(x32Offset);
            ptVal = physicalA.toJSNumber();
            frame = physicalA.mod(lFrameBits).toJSNumber();
            //ptVal = frame;
        }
        var toPrint = "PD["+pd+"] = \""+pdVal+"\", PT["+pt+"] = \""+ptVal+"\", page offset = "+offset+".\n";

        $("#data").text(toPrint);
        //console.log(toPrint);
        drawCanvas(X32MODE);
    return;
    }

    /**
     * x64 mode
     */
    if ($("#x64").prop("checked")) {   // x64 mode


        if ($("#k4").prop("checked")) { // 4K paging
            x64Offset = Math.pow(2,12);
        } else if ($("#m2").prop("checked")) {  // 2M paging
            x64Offset = Math.pow(2,21);
        } else {        // 1 G paging
            x64Offset = Math.pow(2,30);
        }
        if (gotL) {
            offset = linearA.mod(x64Offset).toJSNumber();
            linearA = linearA.divide(x64Offset);

            switch(x64Offset) {
                case Math.pow(2,12):
                pt = linearA.mod(x64Table).toJSNumber();
                linearA = linearA.divide(x64Table);
                pd = linearA.mod(x64Table).toJSNumber();
                linearA = linearA.divide(x64Table);
                pdp = linearA.mod(x64Table).toJSNumber();
                linearA = linearA.divide(x64Table);
                pml4 = linearA.mod(x64Table).toJSNumber();
                break;
                case Math.pow(2,21):
                pd = linearA.mod(x64Table).toJSNumber();
                linearA = linearA.divide(x64Table);
                pdp = linearA.mod(x64Table).toJSNumber();
                linearA = linearA.divide(x64Table);
                pml4 = linearA.mod(x64Table).toJSNumber();
                break;
                case Math.pow(2,30):
                pdp = linearA.mod(x64Table).toJSNumber();
                linearA = linearA.divide(x64Table);
                pml4 = linearA.mod(x64Table).toJSNumber();
                break;
            }
        }
        
        if (gotP) {
            frameData = physicalA.mod(x64Offset).toJSNumber();
            physicalA = physicalA.divide(x64Offset);
            frame = physicalA.mod(pFrameBits).toJSNumber();
        }
        var toPrint = "";
        switch(x64Offset) {
            case Math.pow(2,12):
            ptVal = frame;
            toPrint = "PML-4["+pml4+"] = "+pml4Val+", PDP["+pdp+"] = "+pdpVal+", PD["+pd+"] = "+pdVal+
                ", PT["+pt+"] = "+ptVal+", page offset = "+offset+".\n";
            drawCanvas(X64LONG4K);
            break;
            case Math.pow(2,21):
            pdVal = frame;
            toPrint = "PML-4["+pml4+"] = "+pml4Val+", PDP["+pdp+"] = "+pdpVal+", PD["+pd+"] = "+pdVal+
                ", page offset = "+offset+".\n";
            drawCanvas(X64LONG2M);
            break;
            case Math.pow(2,30):
            pdpVal = frame;
            toPrint = "PML-4["+pml4+"] = "+pml4Val+", PDP["+pdp+"] = "+pdpVal+", page offset = "+offset+".\n";
            drawCanvas(X64LONG1G);
            break;
        }    
        $("#data").text(toPrint);
        //console.log(toPrint);
    }

}

function getMode(){
    if ($("#x32").prop("checked")) {
        return X32MODE;
    }
    if ($("#x64").prop("checked")) {
        if ($("#k4").prop("checked")) {
            return X64LONG4K;
        }
        if ($("#m2").prop("checked")) {
            return X64LONG2M;
        }
        if ($("#g1").prop("checked")) {
            return X64LONG1G;
        }
        return -1;
    }
}

function drawCanvas(){
   drawCanvas(getMode());
}

function drawCanvas(mode) {
    if (mode === undefined)
        mode = getMode();
    var img;
    switch (mode){
        case X32MODE:
        img = "img/x32.png";
        break;
        case X64LONG4K:
        img = "img/x64_4k.png";
        break;
        case X64LONG2M:
        img = "img/x64_2m.png";
        break;
        case X64LONG1G:
        img = "img/x64_1g.png";
        break;
        X64COMP:
        break;
    }

    $('canvas').clearCanvas();
    $('canvas').drawImage({
        source: img,
        x: $('canvas').width()/2, y:$('canvas').height()/2,
        fromCenter: true
      });     
      populateTables();
}

function populateTables(){
    switch (getMode()){
        case X32MODE:
        putText(150,240,pd);
        putText(250,240,pdVal);
        putText(460,240,pt);
        putText(560,240,ptVal);
        putText(655,45,offset);
        break;
        case X64LONG4K:
        putText(100,225,pml4);
        putText(170,225,pml4Val);
        putText(320,230,pdp);
        putText(390,227,pdpVal);
        putText(540,230,pd);
        putText(610,230,pdVal);
        putText(765,230,pt);
        putText(830,230,ptVal);
        putText(920,63,offset);
        break;
        case X64LONG2M:
        putText(15,245,pml4);
        putText(80,245,pml4Val);
        putText(320,245,pdp);
        putText(400,245,pdpVal);
        putText(630,245,pd);
        putText(700,245,pdVal);
        putText(830,55,offset);
        break;
        case X64LONG1G:
        putText(170,240,pml4);
        putText(250,240,pml4Val);
        putText(475,240,pdp);
        putText(560,240,pdpVal);
        putText(695,50,offset);
        break;
        X64COMP:
        break;
    }
}


function putText(x,y,text){
    $('canvas').drawText({
        fillStyle: '#36c',
        fontSize: '14pt',
        fontFamily: 'Calibri',
        text: text,
        x: x, y: y,
        align: 'left',
        respectAlign: true
      });
}

function calcData() {
    var linear, physical;
    if ($("#linearAddressTextBox").val() != "")
        linear = bigInt($("#linearAddressTextBox").val(), prevLinearBase);
    else linear = bigInt(0,10);
    if ($("#physicalAddressTextBox").val() != "")
        physical = bigInt($("#physicalAddressTextBox").val(), prevPhysicalBase);
    else physical = bigInt(0,10);
    var str = "How did I calculate?<br/><br/>Linear address "+linear+" maps to the physical address "+physical+".<br/><br/>";
    str += "Let's parse the linear address which responsible for tables ENTRANCE!<br/><br/>";
    switch (getMode()){
        case X32MODE:
        str += "We are in x32. So offset is 12 lowest bits of the linear address:<br/>";
        str += linear + "/2^12 = " + (linear=linear.divide(Math.pow(2,12))) + ". The remainder is the offset: "+ offset+".<br/>";
        str += "The next 9 bits are the PT entrance: "+linear+"/2^9 = "+(linear=linear.divide(Math.pow(2,9)));
        str += ". The remainder is the PT entrance: "+pt+".<br/>";
        str += "The next 9 bits are the PD entrance: "+pd+". The rest of the bits are sign extend and not relevant.";
        str += "<br/><br/>Now let's take a look at the physical address: "+physical+". We are interested in the bits 12-31<br/>";
        str += "which responsible for the page frame. So "+physical+"/2^12 = " +physical.divide(Math.pow(2,12))+".";
        str += " Our 20 bits value is "+frame+".<br/>";
        str += "<br/>To conclude: PD["+pd+"] = \""+pdVal+"\", PT["+pt+"] = \""+ptVal+"\", page offset = "+offset+".<br/><br/>";
        break;
        case X64LONG4K:
            str +="Comming soon."
        break;
        case X64LONG2M:
            str +="Comming soon."
        break;
        case X64LONG1G:
            str +="Comming soon."
        break;
        X64COMP:
            str +="Comming soon."
        break;
    }
    $("#calcData").html(str);
}