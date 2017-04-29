// Setup after jQuery is initialized
$(document).ready(function() {
    // Set up event listeners
    
    // Calculate price after button is clicked, but before modal is shown
    $('#calculatedPriceModal').on('show.bs.modal', function() {
        populate_cost_fields();
    });

})

function populate_cost_fields() {
    // Calculate program cost
    var age_num = $('#formAgeInput').val();
    var age_category = getAgeCategory(age_num);
    console.log("Age: " + age_num + ', category: ' + age_category);

    var land_category = $('#formLandCategoryRadio input:checked').val();
    console.log("Land Category:", land_category);

    var days_program = $('#formDaysOfProgramInput').val();
    console.log("Program days:", days_program);

    var nights_accom = $('#formNightsOfAccomInput').val();
    console.log("Nights accommodation:", nights_accom);


    // prepay:
    // 0: 30 may
    // 1: 30 june
    // 2: no
    var prepay_category = $('#formPrepayUntilInput input:checked').val();
    console.log("Prepay by category", prepay_category);

    var program_cost = getProgramCost(land_category, age_category, days_program, prepay_category);

    // Set program cost in page
    document.getElementById("program_cost").innerHTML = program_cost;


    // Calculate accommodation cost
    var accom_type = $('#formAccommodationTypeInput input:checked').val();
    var accom_cost = getAccommodationCost(nights_accom, accom_type);
    console.log("Accommodation type", accom_type);
    document.getElementById("accom_cost").innerHTML = accom_cost;

    // Food cost
    var food_cost = getFoodCost();
    document.getElementById("food_cost").innerHTML = food_cost;
    
    // HEJ discount
    // TODO warn if age is > 30
    var is_hej_member = $('#formHEJMemberCheckbox').is(':checked');
    console.log('HEJ member', is_hej_member);
    var hej_discount  = getHEJDiscount(is_hej_member, days_program);
    document.getElementById("hej_discount").innerHTML = hej_discount;

    // Unofficial invitation letter
    var is_invitation = $('#formInvitationCheckbox').is(':checked');
    console.log('Invitation', is_invitation);
    var invitation_cost  = is_invitation ? 5 : 0;
    document.getElementById("invitation_cost").innerHTML = invitation_cost;

    // Add up total cost without paypal charge
    // Round to 0 if negative
    var total_cost_no_paypal = program_cost + accom_cost + food_cost + invitation_cost - hej_discount;
    total_cost_no_paypal = total_cost_no_paypal < 0 ? 0 : total_cost_no_paypal;

    // Paypal charge
    var is_paypal = $('#formPaypalCheckbox').is(':checked');
    console.log('Paypal', is_paypal);
    var paypal_charge = is_paypal ? (0.05 * total_cost_no_paypal) : 0;
    document.getElementById("paypal_charge").innerHTML = paypal_charge.toFixed(2);

    var total_cost = total_cost_no_paypal + paypal_charge;
    document.getElementById("total_cost").innerHTML = total_cost + " &euro;";

}

// returns age category
// 0: 0-18
// 1: 19-29
// 2: 30+ (or invalid age)
function getAgeCategory(age_num) {
    var ageCat; 

    if (age_num >= 0 && age_num <= 18) {
        ageCat = 0;
    } else if (age_num >= 0 && age_num <= 29) {
        ageCat = 1;
    } else {
        ageCat = 2; 
    }

    return ageCat;
}

// returns total program cost in euros
function getProgramCost(land_cat, age_cat, num_days, prepay_cat) {

    console.log(prepay_cat, age_cat);

    // define price tables for each land category
    // [prepay_cat][age_cat]

    var A_pricetable = [
        [30, 50, 80],
        [50, 70, 100],
        [70, 90, 120]
    ];

    var B_pricetable = [
        [20, 30, 50],
        [40, 50, 70],
        [60, 70, 90]
    ];

    var C_pricetable = [
        [0, 0, 80],
        [0, 0, 100],
        [20, 20, 120]
    ];

    var relevant_table;
    if (land_cat === "A") {
        relevant_table = A_pricetable;
    } else if (land_cat === "B") {
        relevant_table = B_pricetable;
    } else if (land_cat === "C") {
        relevant_table = C_pricetable;
    } else {
        console.log("invalid land cat");
    }

    var total_price = relevant_table[prepay_cat][age_cat];

    console.log("pricetable price:", total_price);

    var return_price = 0;
    
    // if participating for at least 5 nights -> full price for 7 days
    // otherwise daily price is total_price / 5
    if (num_days >= 5) {
        return_price = total_price; 
    } else {
        var daily_price = total_price / 5;
        return_price = num_days * daily_price;
    }

    console.log("return price:", return_price);

    return return_price;
}

function getAccommodationCost(num_nights, type) {
    var price_table = {};
    price_table["2_beds"] = 15;
    price_table["3_4_beds"] = 12;
    price_table["6_10_beds"] = 10;
    price_table["tent"] = 7;

    var MAX_NIGHTS = 6;

    if (num_nights > MAX_NIGHTS) {
        num_nights = MAX_NIGHTS;
    }

    return num_nights * price_table[type];

}

function getFoodCost() {
    var num_breakfast = 0;
    var num_lunch     = 0;
    var num_dinner    = 0;

    for (var i = 1; i <= 6; i++) {
        var break_check = document.getElementById("break" + i);
        if (break_check.checked)
            num_breakfast++;
    }
    console.log("numbreak:", num_breakfast);

    for (var i = 1; i <= 5; i++) {
        var break_check = document.getElementById("lunch" + i);
        if (break_check.checked)
            num_lunch++;
    }

    for (var i = 1; i <= 6; i++) {
        var break_check = document.getElementById("dinner" + i);
        if (break_check.checked)
            num_dinner++;
    }

    var BREAK_COST  = 2.5;
    var LUNCH_COST  = 4;
    var DINNER_COST = 3;

    var break_total_cost  = num_breakfast * BREAK_COST;
    var lunch_total_cost  = num_lunch     * LUNCH_COST;
    var dinner_total_cost = num_dinner    * DINNER_COST;

    return break_total_cost + lunch_total_cost + dinner_total_cost;
}

// returns absolute value of discount (non-negative!)
function getHEJDiscount(is_hej_member, num_days) {
    if (!is_hej_member) {
        return 0; 
    }

    var DAILY_DISCOUNT = 4;
    var MAX_DISCOUNT   = 20;

    var daily_discount_total = num_days * DAILY_DISCOUNT;
    var discount = (daily_discount_total > MAX_DISCOUNT) ? MAX_DISCOUNT : daily_discount_total;

    return discount;
}

//TODO
function disableHEJDiscount() {
    alert("triggered");
    var form = document.getElementById("pricecalc");
    var age_num = form.age.value;
    var age_category = getAgeCategory(age_num);

    // Disable HEJ discount if 30+
    if (age_category >= 2) {
        form.hej_member.checked = false; 
        form.hej_member.disabled = true;
    } else {
        form.hej_member.disabled = false;
    }

}

// Toggles all checkboxes with ids of the form 'idname2',
// from start_id to end_id including both
function toggle_all_ids(idname, start_id, end_id) {
    for (var i = start_id; i <= end_id; i++) {
        var checkbox = document.getElementById(idname + i);
        checkbox.checked = !checkbox.checked;
    }
}

