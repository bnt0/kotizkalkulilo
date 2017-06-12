// Setup after jQuery is initialized
$(document).ready(function() {
    // Set up event listeners

    setUpCountryCatNote = function() {
      var country_iso = $('#formCountrySelect').val();
      var country_category = getCountryCategoryFromCountryCode(country_iso);
      console.log("Country ISO2: " + country_iso + ", Category: ", country_category);
      var country_name = $('#formCountrySelect option:selected').text();
      document.getElementById("country_category_note").innerHTML = country_name + ' estas en kategorio ' + country_category;
    };

    setUpCountryCatNote();

    // When country is selected, show category note
    $('#formCountrySelect').on('change', function(){
        setUpCountryCatNote();
    });

    // Calculate price after button is clicked, but before modal is shown
    $('#calculatedPriceModalToggle').click(function() {
        populate_cost_fields();
        var dialog = document.querySelector('dialog');
        if (! dialog.showModal) {
            dialogPolyfill.registerDialog(dialog);
        }
        dialog.showModal();
        dialog.querySelector('.close').addEventListener('click', function(e) {
        dialog.close();
        });
    });

});

function populate_cost_fields() {
    // Calculate program cost
    console.info('populate');
    var age_num = $('#formAgeInput').val();
    var age_category = getAgeCategory(age_num);
    console.log("Age: " + age_num + ', category: ' + age_category);

    var country_iso = $('#formCountrySelect').val();
    var country_category = getCountryCategoryFromCountryCode(country_iso);
    console.log("Country ISO2: " + country_iso + ", Category: ", country_category);
    var country_name = $('#formCountrySelect option:selected').text();
    document.getElementById("country_category_note").innerHTML = country_name + ' estas en kategorio ' + country_category;

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

    var program_cost = getProgramCost(country_category, age_category, days_program, prepay_category);

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

    // Student discount
    var is_student = $('#formStudentCheckbox').is(':checked');
    console.log('student', is_student);
    var STUDENT_DISCOUNT_VALUE = 10;
    var student_discount = is_student ? STUDENT_DISCOUNT : 0;

    // Unofficial invitation letter
    var is_invitation = $('#formInvitationCheckbox').is(':checked');
    console.log('Invitation', is_invitation);
    var invitation_cost  = is_invitation ? 5 : 0;
    document.getElementById("invitation_cost").innerHTML = invitation_cost;

    // Add up total cost without paypal charge
    // Round to 0 if negative
    var total_cost_no_paypal = program_cost + accom_cost + food_cost + invitation_cost - hej_discount - student_discount;
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

// returns 'A', 'B' or 'C' for the apt category
function getCountryCategoryFromCountryCode(country) {
    // A: AÅ­strio, Belgio, Britio, Danio, Finnlando, Francio, Germanio, Hispanio, Irlando, Islando, Italio, Luksemburgo, Nederlando, Norvegio, Svedio, Svislando
    var a_countries = ['AT', 'BE', 'GB', 'DK', 'FI', 'FR', 'DE', 'ES', 'IE', 'IS', 'IT', 'LU', 'NL', 'NO', 'SE', 'CH'];
    // B: european countries ekc. kat. A
    var b_countries = [ 'AL', 'AD', 'AM', 'AT', 'BY', 'BE', 'BA', 'BG', 'CH', 'CY', 'CZ', 'DE',
                        'DK', 'EE', 'ES', 'FO', 'FI', 'FR', 'GB', 'GE', 'GI', 'GR', 'HU', 'HR',
                        'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MK', 'MT', 'NO', 'NL', 'PL',
                        'PT', 'RO', 'RU', 'SE', 'SI', 'SK', 'SM', 'TR', 'UA', 'VA' ];

    // B: cxio alia
    if (a_countries.indexOf(country) !== -1) {
        return 'A';
    } else if (b_countries.indexOf(country) !== -1) {
        return 'B';
    } else {
        return 'C';
    }
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
    price_table.tent = 7;

    var MAX_NIGHTS = 6;

    if (num_nights > MAX_NIGHTS) {
        num_nights = MAX_NIGHTS;
    }

    return num_nights * price_table[type];

}

function getFoodCost() {
    // TODO make this globally configurable
    var FIRST_BREAKFAST_ID = 2;
    var LAST_BREAKFAST_ID  = 7;
    var FIRST_LUNCH_ID = 2;
    var LAST_LUNCH_ID  = 6;
    var FIRST_DINNER_ID = 1;
    var LAST_DINNER_ID  = 6;

    var num_breakfast = 0;
    var num_lunch     = 0;
    var num_dinner    = 0;

    var i;
    var elem;

    for (i = FIRST_BREAKFAST_ID; i <= LAST_BREAKFAST_ID; i++) {
        elem = document.getElementById("break" + i);
        if (elem.checked)
            num_breakfast++;
    }
    console.log("numbreak:", num_breakfast);

    for (i = FIRST_LUNCH_ID; i <= LAST_LUNCH_ID; i++) {
        elem = document.getElementById("lunch" + i);
        if (elem.checked)
            num_lunch++;
    }

    for (i = FIRST_DINNER_ID; i <= LAST_DINNER_ID; i++) {
        elem = document.getElementById("dinner" + i);
        if (elem.checked)
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
    var elems = [];
    for (var i = start_id; i <= end_id; i++) {
        var checkbox = $('#' + idname + i);
        elems.push(checkbox);
    }
    toggle_list(elems);
}

// Toggles all checkboxes with breakfast/lunch/dinner for the given number,
// (if they exist)
function toggle_day(id) {
    var tags  = ["break", "lunch", "dinner"];
    var all_possible_elems = tags.map(function(tag) {
        return $('#' + tag + id);
    });
    var existing_elems = all_possible_elems.filter(function(elem) {
        return elem.length;
    });
    toggle_list(existing_elems);
}

// If all ticked -> untick all
// If some checkboxes unticked -> tick all
function toggle_list(existing_elems) {
    var is_all_checked = existing_elems.every(function(elem) {
        return elem.is(':checked');
    });

    if (is_all_checked) {
        existing_elems.forEach(function(elem) {
            elem.prop('checked', false);
            elem.parent()[0].MaterialCheckbox.uncheck();
        });
    } else {
        existing_elems.forEach(function(elem) {
            elem.prop('checked', true);
            elem.parent()[0].MaterialCheckbox.check();
        });
    }
}
