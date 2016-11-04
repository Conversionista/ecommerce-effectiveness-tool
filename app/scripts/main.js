/* global $, gapi, swal, moment, numeral */

var viewId = '';
var accountId = '';
var propertyId = '';

var queryArray = ['PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT', 'TRANSACTION'];
var queryObj = {};

var apiKey = 'AIzaSyAyOwKc0A79Db1vSRo6N0ZaxBAJqKY4ibc';
var CLIENT_ID = '856128908931-99pe52krvhcn0v81oie89b357gqvgamq.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/plus.me', 'https://www.googleapis.com/auth/plus.profile.emails.read'];

$(document).ready(function(){

	$('#get-funnel-btn').on('click', function(event){
		'use strict';

		event.preventDefault();

		var startDate = moment().subtract(31, 'days').format('YYYY-MM-DD');
		var endDate = 	moment().subtract(1, 'days').format('YYYY-MM-DD');
		APIResponse(viewId, startDate, endDate);

		console.log(startDate);
		console.log(endDate);
		console.log(viewId);
		//queryUsers(viewId, startDate, endDate);
		return false;
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
		//queryProperties(viewId);
		$('#get-funnel-btn').prop('disabled', false);
	});
});

//////////////////////////////////////// F U N C T I O N S /////////////////////////////////////////

//Collect the result from all the queries (when), then turn them into variables (then)
function APIResponse(viewId, startDate, endDate){

	$.when(
		queryShoppingStage(viewId, startDate, endDate),
		queryUsers(viewId, startDate, endDate),
		queryNonBounce(viewId, startDate, endDate)

	).then(function(shoppingStageRes, usersRes, nonBounceRes){
		
		// Handle results from queryShoppingStage
		// Loop through all the rows in the shoppingStage object
		for(var i = 0; i < shoppingStageRes.result.reports[0].data.rows.length; i++) {

			// Dimension name is inherited into the variabele 'dimensionName'
			var dimensionName = shoppingStageRes.result.reports[0].data.rows[i].dimensions[0];
			// console.log(dimensionName);

			// Check if dimensionName is part of queryArray
			if(jQuery.inArray(dimensionName, queryArray) >= 0) {
				// If TRUE, add the value and name the object after the dimension name
				queryObj[dimensionName] = shoppingStageRes.result.reports[0].data.rows[i].metrics[0].values[0];
			}
		}

		// handle result from queryUsers and push into query object
		queryObj['USERS'] = usersRes.result.reports[0].data.rows[0].metrics[0].values[0];

		// handle result from queryNonBounce and push into query object
		queryObj['NON_BOUNCE_USERS'] = nonBounceRes.result.reports[0].data.rows[0].metrics[0].values[0];

		// Calculate engagement rate
		var engagementRate = getPercent(queryObj.NON_BOUNCE_USERS, queryObj.USERS);
		//alert('Engagement rate: '+engagementRate+'%');

		$('#engagement span').text(engagementRate+'%');

		// Calculate finding rate
		var findingRate = getPercent(queryObj.PRODUCT_VIEW, queryObj.NON_BOUNCE_USERS);
		//alert('Finding rate: '+findingRate+'%');

		$('#find span').text(findingRate+'%');

		// Calculate product page effectiveness rate
		var productPageEffectivenessRate = getPercent(queryObj.ADD_TO_CART, queryObj.PRODUCT_VIEW);
		//alert('Product Page Effectiveness Rate: '+productPageEffectivenessRate+'%');

		$('#effectiveness span').text(productPageEffectivenessRate+'%');

		// Calculate checkout rate
		var checkoutRate = getPercent(queryObj.CHECKOUT, queryObj.ADD_TO_CART);
		//alert('Checkout Rate: '+checkoutRate+'%');

		$('#begin-checkout span').text(checkoutRate+'%');

		// Calculate checkout completion rate
		var checkoutCompletionRate = getPercent(queryObj.TRANSACTION, queryObj.CHECKOUT);
		//alert('Checkout Completion Rate: '+checkoutCompletionRate+'%');

		$('#complete-checkout span').text(checkoutCompletionRate+'%');

		// Calculate cart abandonment rate
		var cartAbandonmentRate = Math.round((1-(queryObj.TRANSACTION / queryObj.CHECKOUT))*100);
		//alert('Cart Abandonment Rate: '+cartAbandonmentRate+'%');

		console.log(queryObj);

		const data = [
		    ['Engagement', queryObj.NON_BOUNCE_USERS],
		    ['Finding product', queryObj.PRODUCT_VIEW],
		    ['Effectiveness', queryObj.ADD_TO_CART],
		    ['Checkout', queryObj.CHECKOUT],
		    ['Transaction', queryObj.TRANSACTION],
		];

		const options = { chart: { width: '100%', height: 500 } };

		const chart = new D3Funnel('#funnel');
		chart.draw(data, options);

	});
}

// API call for all users
function queryUsers(viewId, startDate, endDate){
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
				samplingLevel: "LARGE",
				metrics: [{

					expression: "ga:users"
					//"expression": 'ga:newUsers'
				}]
			}]
		}
	});

	return result;
}

// API call for non-bounce users
function queryNonBounce(viewId, startDate, endDate){
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
						expression: "ga:users"
					}
				],
				samplingLevel: "LARGE",
				viewId: viewId,
				dimensions:[{
					name: "ga:segment"}],
				segments: [{
					dynamicSegment: {
						name: "segment_name",
						sessionSegment: {
							segmentFilters: [{
								simpleSegment: {
									orFiltersForSegment: [{
										segmentFilterClauses: [{
											metricFilter: {
												metricName: "ga:bounces",
												operator: "EQUAL",
												comparisonValue: "0"
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
function queryShoppingStage(viewId, startDate, endDate){

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
				samplingLevel: "LARGE",
				metrics: [
					{
						expression: "ga:users"
					}
				],
				viewId: viewId,
				dimensions:[{
					name: "ga:shoppingStage"
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
        text: 'We\'ll need to permission to access your GA Account.<br /> We won\'t save any infomation what so ever.',
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
			$('#accountId').append($('<option/>', {
				value: val.id,
				text: val.name
			}));
		});
		// Get the first Google Analytics account.
		var firstAccountId = response.result.items[0].id;

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
			$('#propertyId').append($('<option/>', {
				value: val.id,
				text: val.name
			}));
		});

		// Get the first Google Analytics account
		var firstAccountId = response.result.items[0].accountId;

		// Get the first property ID
		var firstPropertyId = response.result.items[0].id;

		// Query for Views (Profiles).
		queryProfiles(firstAccountId, firstPropertyId);
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
				$('#viewId').append($('<option/>', {
				value: val.id,
				text: val.name
			}));
		});

		// Get the first View (Profile) ID.
		var firstProfileId = response.result.items[0].id;

		// Query the Core Reporting API.
		queryCoreReportingApi(firstProfileId);
	} else {
		console.log('No views (profiles) found for this user.');
	}
}

function queryCoreReportingApi(profileId){
	// Query the Core Reporting API for the number sessions for the past seven days.
	gapi.client.analytics.data.ga.get({
		'ids': 'ga:' + profileId,
		'start-date': '7daysAgo',
		'end-date': 'today',
		'metrics': 'ga:sessions'
	})
	
	.then(function(response) {
		var formattedJson = JSON.stringify(response.result, null, 2);
		console.log(response.result);
		//document.getElementById('query-output').value = formattedJson;
	})
	.then(null, function(err) {
		// Log any errors.
		console.log(err);
	});
}

// Add an event listener to the 'auth-button'.
document.getElementById('auth-button').addEventListener('click', authorize);

// const data = [
//     ['Plants',     5000],
//     ['Flowers',    2500],
//     ['Perennials', 200],
//     ['Roses',      50],
//     ['Roses',      50],
// ];
// const options = { chart: { width: '100%', height: 500 } };

// const chart = new D3Funnel('#funnel');
// chart.draw(data, options);

