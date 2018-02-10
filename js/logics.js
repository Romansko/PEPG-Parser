/// PE & PG Parser made by Roman Koifman (c) 2018.



/************************** MAIN **************************/
var cpuTypeSet, modeSet, pgSizeSet;
var bX32, bX64;
var bCompMode, bLongMode, bSysManagMode;
var b4K, b2M, b1G;
const HEX = 16, DEC = 10, BIN = 2;
var prevLinearBase = HEX, prevPhysicalBase = HEX; 


/***/

/**
 * On page loaded
 */
$(document).ready(function(){
    $('canvas').hide();

    // cpu set
    cpuTypeSet = document.getElementById("cpuset");
    bX32 = cpuTypeSet.elements[0];
    bX32.onclick = x32Checked;
    bX64 = cpuTypeSet.elements[1];
    bX64.onclick = x64Checked;

    // mode set
    modeSet = document.getElementById("modeset");
    bCompMode = modeSet.elements[0];
    bLongMode = modeSet.elements[1];
    bSysManagMode = modeSet.elements[2];

    // paging related
    disableLinearAdress(true);
    $("#pg").change(pgHandler);
    pgSizeSet = document.getElementById("pgsize");
    b4K = pgSizeSet.elements[0];
    b2M = pgSizeSet.elements[1];
    b1G = pgSizeSet.elements[2];

    
    // linear address
    $("#linearAddressTextBox").keydown(function(e){
        preventType(prevLinearBase, e);
    });
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

    $("#parseBtn").click(function(){
        
    });
    

});


function disableLinearAdress(toDisable){
    if (toDisable)
        $("#linearAddressTextBox").val("Paging disabled. Linear address = Physical address.");
    else 
        $("#linearAddressTextBox").val("");
    $("#linearAddressTextBox").prop( "disabled", toDisable );
    $("#linearAddrrHex").prop( "disabled", toDisable );
    $("#linearAddrrDec").prop( "disabled", toDisable );
    $("#linearAddrrBin").prop( "disabled", toDisable );
}

function preventType(Base, e) {
    if (Base === BIN) {
        if (e.keyCode != 48 && e.keyCode != 49 && e.keyCode != 96 && e.keyCode != 97)
            e.preventDefault();
    }
    if (Base === DEC) {
        if (isNaN(String.fromCharCode(e.which)))
            event.preventDefault(); 
    }
    if (Base === HEX) {
        if (!((e.keyCode >= 48 && e.keyCode <= 70) || (e.keyCode >= 96 && e.keyCode <= 105)))
            event.preventDefault(); 
    }
}

/**
 * convert number base
 * @param {*} n num to convert
 * @param {*} fromBase 
 * @param {*} toBase 
 */
function convertNumber(n, fromBase, toBase) {
    if (n === "") return 0;
    return parseInt(n.toString(), fromBase).toString(toBase);
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
    if (this.checked){
        for (var i=0; i<pgSizeSet.elements.length; ++i)
            pgSizeSet.elements[i].disabled = false;
        b4K.checked = true;
        if (bX32.checked){
            b2M.disabled = true;
            b1G.disabled = true;
        }
        disableLinearAdress(false);
    }
    else {
        for (var i=0; i<pgSizeSet.elements.length; ++i) {
            pgSizeSet.elements[i].disabled = true;
            pgSizeSet.elements[i].checked = false;
        }
        disableLinearAdress(true);
    }
}
