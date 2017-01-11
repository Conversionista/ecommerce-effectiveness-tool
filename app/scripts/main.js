/* global $, gapi, swal, moment, numeral */

// Check if anything is saved in the ecomFunnel object in local storage 
if (readLocal('ecomFunnel') !== null) {

	var l = readLocal('ecomFunnel');

	console.log(l);

	var accountId = l.accountId;
	var propertyId = l.propertyId;
	var viewId = l.viewId;

} else {

	var accountId = false;
	var propertyId = false;
	var viewId = false;
}

var queryArray = ['PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT', 'TRANSACTION'];
var queryObj = {};

var apiKey = 'AIzaSyAyOwKc0A79Db1vSRo6N0ZaxBAJqKY4ibc';
var CLIENT_ID = '856128908931-99pe52krvhcn0v81oie89b357gqvgamq.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/plus.me', 'https://www.googleapis.com/auth/plus.profile.emails.read'];

var startDate = moment().subtract(31, 'days').format('YYYY-MM-DD');
var endDate = 	moment().subtract(1, 'days').format('YYYY-MM-DD');

var deviceCategory = '';
var userType = '';

var engagementResult = 0;
var findResult = 0;
var effectivenessResult = 0;
var beginCheckoutResult = 0;
var completeCheckoutResult = 0;

$(document).ready(function(){

	$('input[name="daterange"]').daterangepicker({
	  'locale': {
	    'format': 'YYYY-MM-DD',
	    'separator': ' – ',
	    'applyLabel': 'Apply',
	    'cancelLabel': 'Undo',
	    'fromLabel': 'From',
	    'toLabel': 'To',
	    'customRangeLabel': 'Custom',
	    'weekLabel': 'w. ',
	    'daysOfWeek': [
	      'Su',
	      'Mo',
	      'Tu',
	      'We',
	      'Th',
	      'Fr',
	      'Sa'
	    ],
	    'monthNames': [
	      'January',
	      'February',
	      'March',
	      'April',
	      'May',
	      'June',
	      'July',
	      'August',
	      'September',
	      'October',
	      'November',
	      'December'
	    ],
	    'firstDay': 1
	  },
	  showISOWeekNumbers: true,
	  applyClass: 'btn btn-success',
	  cancelClass: 'btn btn-danger',
	  startDate: startDate,
	  endDate: endDate
	});

	// Set start and end date for primary date range on click
	$('#date-range').on('apply.daterangepicker', function(ev, picker) {

		startDate = picker.startDate.format('YYYY-MM-DD');
		endDate = picker.endDate.format('YYYY-MM-DD')
		
		$('#date-range').val(picker.startDate.format('YYYY-MM-DD')+' to '+picker.endDate.format('YYYY-MM-DD'));

	});

	// Set start and end date for comparison date range and get result from API queries on click
	$('#comparison-range').on('apply.daterangepicker', function(ev, picker) {

		var comparisonStartDate = picker.startDate.format('YYYY-MM-DD');
		var comparisonEndDate = picker.endDate.format('YYYY-MM-DD')
		
		$('#comparison-range').val(picker.startDate.format('YYYY-MM-DD')+' to '+picker.endDate.format('YYYY-MM-DD'));

		APIResponse(viewId, comparisonStartDate, comparisonEndDate, deviceCategory, userType, true);

	});

	// Set default values in input fields
	$('#date-range').val(startDate+' to '+endDate);
	$('#comparison-range').val('');

	// Saves account settings to local storage
	$('#save-settings-btn').on('click', function(event){
		'use strict';

		event.preventDefault();

		updateLocal('ecomFunnel', 'accountId', accountId);
		updateLocal('ecomFunnel', 'propertyId', propertyId);
		updateLocal('ecomFunnel', 'viewId', viewId);

		// console.log(startDate);
		// console.log(endDate);
		// console.log(viewId);
		
	});

	// Get data from API on click
	$('#get-funnel-btn').on('click', function(event){
		'use strict';

		event.preventDefault();
		
		deviceCategory = $('input[name="deviceCategory"]:checked').val();
		userType = $('input[name="userType"]:checked').val();

		APIResponse(viewId, startDate, endDate, deviceCategory, userType);

	});


	$('#accountId').on('change', function(){

		accountId = $(this).val();
		queryProperties(accountId);
	});

	$('#propertyId').on('change', function(){

		propertyId = $(this).val();
		queryProfiles(accountId, propertyId);
	});

	$('#viewId').on('change', function(){

		viewId = $(this).val();

		$('#get-funnel-btn').prop('disabled', false);
		$('#save-settings-btn').prop('disabled', false);
	});
});

//////////////////////////////////////// F U N C T I O N S /////////////////////////////////////////

//Collect the result from all the queries (when), then turn them into variables (then)
function APIResponse(viewId, startDate, endDate, deviceCategory, userType, comparison){

	$.when(
		queryShoppingStage(viewId, startDate, endDate, deviceCategory, userType),
		queryUsers(viewId, startDate, endDate, deviceCategory, userType),
		queryNonBounce(viewId, startDate, endDate, deviceCategory, userType)

	).then(function(shoppingStageRes, usersRes, nonBounceRes){
		
		// Handle results from queryShoppingStage
		// Loop through rows in the shoppingStage object
		for(var i = 0; i < shoppingStageRes.result.reports[0].data.rows.length; i++) {

			// Dimension name is inherited into the variabele 'dimensionName'
			var dimensionName = shoppingStageRes.result.reports[0].data.rows[i].dimensions[0];
			console.log(dimensionName);

			// Check if dimensionName is part of queryArray
			if(jQuery.inArray(dimensionName, queryArray) >= 0) {

				// If TRUE, add the value and name the object after the dimension name
				queryObj[dimensionName] = shoppingStageRes.result.reports[0].data.rows[i].metrics[0].values[0];
			}
		}

		queryObj['USERS'] = 0;

		$.each(usersRes.result.reports[0].data.rows, function(key, value) {
			
			queryObj['USERS'] += Number(value.metrics[0].values[0]);
		});

		//console.log(queryObj['USERS']);

		// handle result from queryUsers and push into query object
		//queryObj['USERS'] = usersRes.result.reports[0].data.rows[0].metrics[0].values[0];

		// handle result from queryNonBounce and push into query object

		queryObj['NON_BOUNCE_USERS'] = 0;
		$.each(nonBounceRes.result.reports[0].data.rows, function(key, value) {
			
			queryObj['NON_BOUNCE_USERS'] += Number(value.metrics[0].values[0]);
		});

		// Calculate engagement rate
		var engagementRate = getPercent(queryObj.NON_BOUNCE_USERS, queryObj.USERS);
		//alert('Engagement rate: '+engagementRate+'%');

		if (checkEcomTracking(engagementRate)){
			 return false;
		}

		var benchmark = [0, 50, 71];

		if (comparison) {

			var trend = getTrend(engagementResult, engagementRate);

			setComparison('engagement', engagementRate, trend, benchmark);

		} else {

			engagementResult = engagementRate;

			setResult('engagement', engagementRate, benchmark);
		}

		// Calculate finding rate
		var findRate = getPercent(queryObj.PRODUCT_VIEW, queryObj.NON_BOUNCE_USERS);
		//alert('Finding rate: '+findRate+'%');

		if (checkEcomTracking(findRate)){
			 return false;
		}

		var benchmark = [0, 60, 81];
		
		if (comparison) {

			var trend = getTrend(findResult, findRate);

			setComparison('find', findRate, trend, benchmark);

		} else {

			findResult = findRate;

			setResult('find', findRate, benchmark);
		}

		// Calculate product page effectiveness rate
		var productPageEffectivenessRate = getPercent(queryObj.ADD_TO_CART, queryObj.PRODUCT_VIEW);
		//alert('Product Page Effectiveness Rate: '+productPageEffectivenessRate+'%');

		if (checkEcomTracking(productPageEffectivenessRate)){
			 return false;
		}

		var benchmark = [0, 15, 21];

		if (comparison) {

			var trend = getTrend(effectivenessResult, productPageEffectivenessRate);

			setComparison('effectiveness', productPageEffectivenessRate, trend, benchmark);

		} else {

			effectivenessResult = productPageEffectivenessRate;

			setResult('effectiveness', productPageEffectivenessRate, benchmark);
		}

		// Calculate checkout rate
		var checkoutRate = getPercent(queryObj.CHECKOUT, queryObj.ADD_TO_CART);
		//alert('Checkout Rate: '+checkoutRate+'%');

		var benchmark = [0, 60, 81];

		if (comparison) {

			var trend = getTrend(beginCheckoutResult, checkoutRate);

			setComparison('begin-checkout', checkoutRate, trend, benchmark);

		} else {

			beginCheckoutResult = checkoutRate;

			setResult('begin-checkout', checkoutRate, benchmark);
		}

		// Calculate checkout completion rate
		var checkoutCompletionRate = getPercent(queryObj.TRANSACTION, queryObj.CHECKOUT);
		//alert('Checkout Completion Rate: '+checkoutCompletionRate+'%');

		var benchmark = [0, 40, 61];

		if (comparison) {

			var trend = getTrend(completeCheckoutResult, checkoutCompletionRate);

			setComparison('complete-checkout', checkoutCompletionRate, trend, benchmark);

		} else {

			completeCheckoutResult = checkoutCompletionRate;

			setResult('complete-checkout', checkoutCompletionRate, benchmark);
		}

		// Calculate cart abandonment rate
		var cartAbandonmentRate = Math.round((1-(queryObj.TRANSACTION / queryObj.CHECKOUT))*100);
		//alert('Cart Abandonment Rate: '+cartAbandonmentRate+'%');

		//console.log(queryObj);

		if (!comparison) {
			var data = [
			    ['Stay on site', [queryObj.NON_BOUNCE_USERS, engagementRate]],
			    ['Finding product', [queryObj.PRODUCT_VIEW, findRate]],
			    ['Add to cart', [queryObj.ADD_TO_CART, productPageEffectivenessRate]],
			    ['Begin checkout', [queryObj.CHECKOUT, checkoutRate]],
			    ['Complete checkout', [queryObj.TRANSACTION, checkoutCompletionRate]],
			];

			var options = { 
				chart: {
					width: '100%', 
					height: 350,
					bottomPinch: 0,
					animate: 100,
					curve: {
						enabled: true,
						height: 20
					}
				},
				block: {
					dynamicHeight: false,
					highlight: true,
					fill: {
						type: 'gradient'
					}
				},
				label: {
					format: '{f}%'
				},
				events: {
					click: {
						block: function(d) {

							if (d.index === 0) {
								swal('Stay on site','Engagement rate or opposite of bounce rate. Users who move on to another page or trigger some kind of event. Good: 70-100% Bad: 0-50%');
							} else if (d.index == 1) {
								swal('Find products','Finding rate, or how many users (out of the stay-on-site-users) who visit at least one product page. Good: 80-100% Bad: 0-60%');
							} else if (d.index == 2) {
								swal('Add to cart','Your product page effectiveness, or how many users (out of the find-product-users) who add an item to shopping cart. Good: 20-100% Bad: 0-15%');
							} else if (d.index == 3) {
								swal('Begin checkout','Checkout rate, or how many users (out of the add-to-cart-users) who visit the checkout page. Good: 80-100% Bad: 0-50%');
							} else if (d.index == 4) {
								swal('Complete checkout','Checkout completion rate, or how many users (out of the begin-checkout-users) who complete the purchase. Good: 60-100% Bad: 0-40%');
							}
						},
					},
				},
			};

			const chart = new D3Funnel('#funnel');
			chart.draw(data, options);
		}
	});
}

// API call for all users
function queryUsers(viewId, startDate, endDate, deviceCategory, userType){

	var deviceCategoryArray = [];

	if(deviceCategory == "all") {
		deviceCategoryArray.push('desktop');
		deviceCategoryArray.push('tablet');
		deviceCategoryArray.push('mobile');
	}
	else {
		deviceCategoryArray.push(deviceCategory);
	}

	var userTypeArray = [];

	if(userType == "all") {
		userTypeArray.push('New Visitor');
		userTypeArray.push('Returning Visitor');
	}
	else {
		userTypeArray.push(userType);
	}

	var dimensions = '';

	var result = gapi.client.request({
		path: '/v4/reports:batchGet',
		root: 'https://analyticsreporting.googleapis.com/',
		method: 'POST',
		body:{

			reportRequests: [{
				
				viewId: viewId,
				dateRanges: [{
				
					startDate: startDate,
					endDate: endDate
				}],
				samplingLevel: 'LARGE',
				metrics: [{

					expression: 'ga:users'
					//expression: 'ga:newUsers'
				}],
				dimensions:[{
					name: 'ga:userType'
				},
				{
					name: 'ga:deviceCategory'
				}],
				dimensionFilterClauses: [{
					operator: 'AND',
					filters: [{
						dimensionName: 'ga:userType',
						operator: 'IN_LIST',
						expressions: userTypeArray
					},
					{
						dimensionName: 'ga:deviceCategory',
						operator: 'IN_LIST',
						expressions: deviceCategoryArray
					}]
		        }]
			}]
		}
	});

	return result;
}

// API call for non-bounce users
function queryNonBounce(viewId, startDate, endDate, deviceCategory, userType){

	var deviceCategoryArray = [];

	if(deviceCategory == "all") {
		deviceCategoryArray.push('desktop');
		deviceCategoryArray.push('tablet');
		deviceCategoryArray.push('mobile');
	}
	else {
		deviceCategoryArray.push(deviceCategory);
	}

	var userTypeArray = [];

	if(userType == "all") {
		userTypeArray.push('New Visitor');
		userTypeArray.push('Returning Visitor');
	}
	else {
		userTypeArray.push(userType);
	}

	var result = gapi.client.request({
		path: '/v4/reports:batchGet',
		root: 'https://analyticsreporting.googleapis.com/',
		method: 'POST',
		body:{
			reportRequests: [{
				dateRanges: [{ 
					endDate: endDate,
					startDate: startDate 
				}],
				metrics: [
					{
						expression: 'ga:users'
					}
				],
				samplingLevel: 'LARGE',
				viewId: viewId,
				dimensions:[{
						name: 'ga:segment'
					},
					{
						name: 'ga:userType'
					},
					{
						name: 'ga:deviceCategory'
					}
				],
				dimensionFilterClauses: [{
					operator: 'AND',
					filters: [{
						dimensionName: 'ga:userType',
						operator: 'IN_LIST',
						expressions: userTypeArray
					},
					{
						dimensionName: 'ga:deviceCategory',
						operator: 'IN_LIST',
						expressions: deviceCategoryArray
					}]
		        }],
				segments: [{
					dynamicSegment: {
						name: 'segment_name',
						sessionSegment: {
							segmentFilters: [{
								simpleSegment: {
									orFiltersForSegment: [{
										segmentFilterClauses: [{
											metricFilter: {
												metricName: 'ga:bounces',
												operator: 'EQUAL',
												comparisonValue: '0'
											}
										}]
									}]
								}
							}]
						}
					}
				}]
			}]
		}
	});

	return result;
}

// API call for users with checkout event
function queryShoppingStage(viewId, startDate, endDate, deviceCategory, userType){

	var deviceCategoryArray = [];

	if(deviceCategory == "all") {
		deviceCategoryArray.push('desktop');
		deviceCategoryArray.push('tablet');
		deviceCategoryArray.push('mobile');
	}
	else {
		deviceCategoryArray.push(deviceCategory);
	}

	var userTypeArray = [];

	if(userType == "all") {
		userTypeArray.push('New Visitor');
		userTypeArray.push('Returning Visitor');
	}
	else {
		userTypeArray.push(userType);
	}

	var result = gapi.client.request({
		path: '/v4/reports:batchGet',
		root: 'https://analyticsreporting.googleapis.com/',
		method: 'POST',
		body:{
			reportRequests: [{
				dateRanges: [{ 
					endDate: endDate, 
					startDate: startDate 
				}],
				samplingLevel: 'LARGE',
				metrics: [
					{
						expression: 'ga:users'
					}
				],
				viewId: viewId,
				dimensions:[{
					name: 'ga:shoppingStage'
				}],
				dimensionFilterClauses: [{
					operator: 'AND',
					filters: [{
						dimensionName: 'ga:userType',
						operator: 'IN_LIST',
						expressions: userTypeArray
					},
					{
						dimensionName: 'ga:deviceCategory',
						operator: 'IN_LIST',
						expressions: deviceCategoryArray
					}]
		        }]
			}]
		}
	});

	return result;
}

function getPercent(val1, val2){
	var res = Math.round((val1 / val2) * 100);
	return res;
}

function getTrend(val1, val2){
	var res = Math.round(val1 - val2);
	return res;
}

function authorize(event){
	// Handles the authorization flow.
	// 'immediate' should be false when invoked from the button click.
	var useImmdiate = event ? false : true;
	var authData = {
		client_id: CLIENT_ID,
		scope: SCOPES,
		immediate: useImmdiate
	};

	gapi.auth.authorize(authData, function(response){
		var authButton = document.getElementById('auth-button');
		if (response.error) {
			authButton.hidden = false;

			showAuthDialog();
		}
		else {
			authButton.hidden = true;
			console.log('inloggad');
			queryAccounts();
		}
	});
}

function showAuthDialog() {
    'use strict';
    swal({
        title: 'GA Authorization',
        html: true,
        text: 'We\'ll need permission to access your Google Analytics account.<br /> We won\'t save any infomation what so ever.',
        imageUrl: 'images/google-analytics-logo.png',
        confirmButtonText: 'Authorize',
        confirmButtonColor: '#5cb85c',
        customClass: 'authorize',
        showCancelButton: false
    });

    $('.authorize .confirm').click(function(event) {
        $(this).html('<i class="fa fa-cog fa-spin"></i>').attr('disabled', true);
        authorize(event);
    });
}

function queryAccounts(){
	
	// Load the Google Analytics client library.
	gapi.client.load('analytics', 'v3').then(function(){
		
		// Get a list of all Google Analytics accounts for this user
		gapi.client.analytics.management.accounts.list().then(handleAccounts);
	});
}

function handleAccounts(response){
	
	// Handles the response from the accounts list method.
	if (response.result.items && response.result.items.length){
	
		$('#accountId').html('<option selected="selected" disabled="true">-- Please select -- </option>').attr('disabled', false);
	
		$.each(response.result.items, function(index, val){

			if (val.id == accountId) {

				var selected = true;

			} else {

				var selected = false;
			}

			$('#accountId').append($('<option/>', {
				value: val.id,
				text: val.name,
				selected: selected
			}));
		});
		// Get the first Google Analytics account.
		if(!accountId) {
			accountId = response.result.items[0].id;
		}

		// Query for properties.
		queryProperties(accountId);

	} else {
		console.log('No accounts found for this user.');
	}
}

function queryProperties(accountId){
	// Get a list of all the properties for the account.
	gapi.client.analytics.management.webproperties.list({'accountId': accountId})
	.then(handleProperties).then(null, function(err) {
	  // Log any errors.
	  console.log(err);
  });
}

function handleProperties(response){
	// Handles the response from the webproperties list method.
	if (response.result.items && response.result.items.length) {

		$('#propertyId').html('<option selected="selected" disabled="true">-- Please select -- </option>').attr('disabled', false);
		
		$.each(response.result.items, function(index, val){

			if (val.id == propertyId) {

				var selected = true;

			} else {

				var selected = false;
			}

			$('#propertyId').append($('<option/>', {
				value: val.id,
				text: val.name,
				selected: selected
			}));
		});

		if(!propertyId) {
			propertyId = response.result.items[0].id;
		}

		// Query for Views (Profiles).
		queryProfiles(accountId, propertyId);
	} else {
		console.log('No properties found for this user.');
	}
}

function queryProfiles(accountId, propertyId){
	// Get a list of all Views (Profiles) for the first property
	// of the first Account.
	gapi.client.analytics.management.profiles.list({
		'accountId': accountId,
		'webPropertyId': propertyId
	})
	.then(handleProfiles).then(null, function(err){
		// Log any errors.
		console.log(err);
	});
}

function handleProfiles(response){
  // Handles the response from the profiles list method.
	if (response.result.items && response.result.items.length) {

		$('#viewId').html('<option selected="selected" disabled="true">-- Please select -- </option>').attr('disabled', false);
			$.each(response.result.items, function(index, val){

				if (val.id == viewId) {

					var selected = true;
					$('#get-funnel-btn').prop('disabled', false);
					$('#save-settings-btn').prop('disabled', false);

				} else {

					var selected = false;
				}

				$('#viewId').append($('<option/>', {
				value: val.id,
				text: val.name,
				selected: selected
			}));
		});

		// Get the first View (Profile) ID.
		var firstProfileId = response.result.items[0].id;

		// Query the Core Reporting API.
		// queryCoreReportingApi(firstProfileId);
	} else {
		console.log('No views (profiles) found for this user.');
	}
}

// Saves stringified object to selected position in local storage
function saveLocal(name, obj) {
    'use strict';
    localStorage.setItem(name, JSON.stringify(obj));
}

// Get and return parsed object from selected position in local storage
function readLocal(name) {
    'use strict';
    var data = JSON.parse(localStorage.getItem(name));
    return data;
}

// Find and update keys and values in object 
function updateLocal(name, k, v) {
    'use strict';
    var data = readLocal(name);

    if (data === null) {
        data = {};
    }

    data[k] = v;

    saveLocal(name, data);
}

function setResult(string, val, benchmark){

	var symbol = setBenchmarkSymbol(val, benchmark);

	$('#'+string+'-result').addClass('').html(val+'%'+symbol);
	$('#th-comparison, #th-trend').addClass('hidden');
	$('#'+string+'-comparison').removeClass('').addClass('hidden').html('');
	$('#'+string+'-trend').removeClass('').addClass('hidden').html('');
}

function setComparison(string, val1, val2, benchmark){

	var symbol = setBenchmarkSymbol(val1, benchmark);
	var trendSymbol = setTrendSymbol(val2);

	$('#th-comparison, #th-trend').removeClass('hidden');
	$('#'+string+'-comparison').removeClass('hidden').addClass('').html(val1+'%'+symbol);
	$('#'+string+'-trend').removeClass('hidden').addClass('').html(val2+'%'+trendSymbol);
}

function setBenchmarkSymbol(needle, haystack){

	var position = 0;

	$.each(haystack, function(key, val){
		
		if (needle >= val) {

			position = key;
		}
	});

	if (position == 0) {

		var symbol = '<span class="text-danger glyphicon glyphicon-exclamation-sign btn-xs" aria-hidden="true"></span>';

	} else if (position == 1) {

		var symbol = '<span class="text-warning glyphicon glyphicon-eye-open btn-xs" aria-hidden="true"></span>';

	} else if (position == 2) {

		var symbol = '<span class="text-success glyphicon glyphicon-ok btn-xs" aria-hidden="true"></span>';
	}

	return '<span>'+symbol+'</span>';
}

function setTrendSymbol(val2){

	if (val2 == 0) {

		var trendSymbol = '<span class="text-warning glyphicon glyphicon-unchecked btn-xs" aria-hidden="true"></span>';

	} else if (val2 > 0) {

		var trendSymbol = '<span class="text-success glyphicon glyphicon-triangle-top btn-xs" aria-hidden="true"></span>';

	} else if (val2 < 0) {

		var trendSymbol = '<span class="text-danger glyphicon glyphicon-triangle-bottom btn-xs" aria-hidden="true"></span>';
	}

	return '<span>'+trendSymbol+'</span>';

}
function checkEcomTracking(val){

	var output = false;

	if (isNaN(val)) {

		swal({
			title: 'Oops!',
			html: true,
			text: 'It seems your website doesn\'t use ecommerce tracking.<br>Please contact us for help!',
			imageUrl: 'images/google-analytics-logo.png',
			confirmButtonText: 'OK :(',
			confirmButtonColor: '#5cb85c',
			customClass: 'authorize',
			showCancelButton: false
		});

		output = true;
	}

	return output;
}

// function queryCoreReportingApi(profileId){
// 	// Query the Core Reporting API for the number sessions for the past seven days.
// 	gapi.client.analytics.data.ga.get({
// 		'ids': 'ga:' + profileId,
// 		'start-date': '7daysAgo',
// 		'end-date': 'today',
// 		'metrics': 'ga:sessions'
// 	})
	
// 	.then(function(response) {
// 		var formattedJson = JSON.stringify(response.result, null, 2);
// 		console.log(response.result);
// 		//document.getElementById('query-output').value = formattedJson;
// 	})
// 	.then(null, function(err) {
// 		// Log any errors.
// 		console.log(err);
// 	});
// }

// Add an event listener to the 'auth-button'.
document.getElementById('auth-button').addEventListener('click', authorize);



