/// PE & PG Parser made by Roman Koifman (c) 2018.



/************************** MAIN **************************/
var cpuTypeSet, modeSet, pgSizeSet;
var bX32, bX64;
var bCompMode, bLongMode, bSysManagMode;
var b4K, b2M, b1G;
const HEX = 16, DEC = 10, BIN = 2, ERR = -1;
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
    bX64 = cpuTypeSet.elements[1];
    $("#x32").change(x32Checked);
    $("#x64").change(x64Checked);

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

    $("#parseBtn").click(parseAddress);
    $("#linClear").click(function(){
        $("#linearAddressTextBox").val("");
    });
    $("#phyClear").click(function(){
        $("#physicalAddressTextBox").val("");
    });
});


function disableLinearAdress(toDisable){
    const txt = "Paging disabled. Linear address = Physical address.";
    if (toDisable)
        $("#linearAddressTextBox").val(txt);
    else if( $("#linearAddressTextBox").val() === txt)
    $("#linearAddressTextBox").val("");
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
    }
    else {
        for (var i=0; i<pgSizeSet.elements.length; ++i) {
            pgSizeSet.elements[i].disabled = true;
            pgSizeSet.elements[i].checked = false;
        }
        disableLinearAdress(true);
    }
}

function parseAddress() {
    const x32Offset = 4096, x32Table = 1024;
    const x64_4kOffset = 4096, x64_4kTable = 512;
    var physicalA, linearA, offset, pt, pd, pdp, pml4;
    if ($("#physicalAddressTextBox").val() !== "")
        physicalA = bigInt($("#physicalAddressTextBox").val(), prevPhysicalBase);
    if ($("#pg").prop("checked"))
        linearA = bigInt($("#linearAddressTextBox").val(), prevLinearBase);
    else linearA = physicalA;       // paging disabled. we have only physical addresses.
    

    if ($("#x32").prop("checked")) {   // x32 mode
        offset = linearA.mod(x32Offset).toJSNumber();
        linearA = linearA.divide(x32Offset);
        pt = linearA.mod(x32Table).toJSNumber();
        linearA = linearA.divide(x32Table);
        pd = linearA.mod(x32Table).toJSNumber();
        var toPrint = "PD["+pd+"]= ?, PT["+pt+"]=?, page offset="+offset+".\n";
        $("#data").text(toPrint);
        console.log(toPrint);
    return;
    }
    if ($("#x64").prop("checked")) {   // x64 mode
        offset = linearA.mod(x64_4kOffset).toJSNumber();
        linearA = linearA.divide(x64_4kOffset);
        pt = linearA.mod(x64_4kTable).toJSNumber();
        linearA = linearA.divide(x64_4kTable);
        pd = linearA.mod(x64_4kTable).toJSNumber();
        linearA = linearA.divide(x64_4kTable);
        pdp = linearA.mod(x64_4kTable).toJSNumber();
        linearA = linearA.divide(x64_4kTable);
        pml4 = pd = linearA.mod(x64_4kTable).toJSNumber();
        var toPrint = "PML4["+pml4+"]=?, PDP["+pdp+"]=?, "+"PD["+pd+"]= ?, PT["+pt+"]=?, page offset="+offset+".\n";
        $("#data").text(toPrint);
        console.log(toPrint);
    return;
    }

}