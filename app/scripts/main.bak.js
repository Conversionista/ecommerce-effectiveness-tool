/* global $, gapi, swal, moment, numeral, jQuery, D3Funnel, analytics, Pace */
/*eslint strict: [2, "never"]*/
/*eslint no-use-before-define: [2, "nofunc"]*/


// Check if anything is saved in the ecomFunnel object in local storage
var ecomFunnel = readLocal('ecomFunnel'); // eslint-disable-line no-unused-vars

if (ecomFunnel !== null) {

	var accountId = ecomFunnel.accountId;
	var propertyId = ecomFunnel.propertyId;
	var viewId = ecomFunnel.viewId;

	console.log(viewId);

} else {

	accountId = false;
	propertyId = false;
	viewId = false;
}

var queryArray = ['ALL_VISITS', 'PRODUCT_VIEW', 'ADD_TO_CART', 'CHECKOUT', 'TRANSACTION'];
var queryObj = {};

var CLIENT_ID = '856128908931-99pe52krvhcn0v81oie89b357gqvgamq.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/plus.me', 'https://www.googleapis.com/auth/plus.profile.emails.read'];

var startDate = moment().subtract(31, 'days').format('YYYY-MM-DD');
var endDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
var comparisonStartDate = 0;
var comparisonEndDate = 0;

var deviceCategory = '';
var userType = '';

var engagementResult = 0;
var findResult = 0;
var effectivenessResult = 0;
var beginCheckoutResult = 0;
var completeCheckoutResult = 0;

$(document).ready(function() {

	Pace.on('done', function() {
		hideLoader();
	});

	// Set date range functionality
	$('input[name="daterange"]').daterangepicker({
		'locale': {
			'format': 'YYYY-MM-DD',
			'separator': ' – ',
			'applyLabel': 'Apply',
			'cancelLabel': 'Cancel',
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
		endDate = picker.endDate.format('YYYY-MM-DD');

		$('#date-range').val(picker.startDate.format('YYYY-MM-DD') + ' to ' + picker.endDate.format('YYYY-MM-DD'));

	});

	$('#date-range').on('cancel.daterangepicker', function() {

		$('#date-range').val(startDate + ' to ' + endDate);

	});

	// Set start and end date for comparison date range and get result from API queries on submit
	$('#comparison-range').on('apply.daterangepicker', function(ev, picker) {

		comparisonStartDate = picker.startDate.format('YYYY-MM-DD');
		comparisonEndDate = picker.endDate.format('YYYY-MM-DD');

		$('#comparison-range').val(picker.startDate.format('YYYY-MM-DD') + ' to ' + picker.endDate.format('YYYY-MM-DD'));

	});

	$('#comparison-range').on('hide.daterangepicker', function(ev, picker) {

		if (comparisonStartDate === 0 && comparisonEndDate === 0) {

			$('#comparison-range').val('');
		} else {
			$('#comparison-range').val(picker.startDate.format('YYYY-MM-DD') + ' to ' + picker.endDate.format('YYYY-MM-DD'));
		}
	});

	$('#comparison-range').on('cancel.daterangepicker', function() {

		comparisonStartDate = 0;
		comparisonEndDate = 0;

		$('#comparison-range').val('');

	});

	// Set default values in input fields
	$('#date-range').val(startDate + ' to ' + endDate);
	$('#comparison-range').val('');

	// Saves account settings to local storage
	$('#save-settings-btn').on('click', function(event) {

		event.preventDefault();

		removeResult();

		updateLocal('ecomFunnel', 'accountId', accountId);
		updateLocal('ecomFunnel', 'propertyId', propertyId);
		updateLocal('ecomFunnel', 'viewId', viewId);

	});

	// Get data from API
	$('#get-funnel-btn').on('click', function(event) {

		event.preventDefault();

		setProgressBar(0);

		deviceCategory = $('input[name="deviceCategory"]:checked').val();
		userType = $('input[name="userType"]:checked').val();

		$.when(
			apiResponse(viewId, startDate, endDate, deviceCategory, userType)
		).then(function(){

			if (comparisonStartDate !== 0 && comparisonEndDate !== 0) {
				apiResponse(viewId, comparisonStartDate, comparisonEndDate, deviceCategory, userType, true);
			}
			$('#get-funnel-btn').text('Update result');
		});
	});

	// Select account, property and view - then enable button
	$('#accountId').on('change', function() {

		accountId = $(this).val();
		queryProperties(accountId);

		$('#viewId').html('<option selected="selected" disabled="true">-- Please select -- </option>').attr('disabled', false);
	});

	$('#propertyId').on('change', function() {

		propertyId = $(this).val();
		queryProfiles(accountId, propertyId);
	});

	$('#viewId').on('change', function() {

		viewId = $(this).val();

		var viewIdName = $('#viewId option:selected').text();

		$('#get-funnel-btn').prop('disabled', false);
		$('#save-settings-btn').prop('disabled', false);

		$('#selected-account').text(viewIdName);
	});

	$('#comparison-toggle').click(function(e) {

		e.preventDefault();

		$('#comparison-date').slideToggle(200, function(){

			$('#comparison-toggle i').toggleClass('fa-angle-down').toggleClass('fa-angle-up');

		});
	});
});

//////////////////////////////////////// F U N C T I O N S /////////////////////////////////////////

// Collect result from all the queries (when), then turn them into variables (then)
function apiResponse(viewId, startDate, endDate, deviceCategory, userType, comparison) { // eslint-disable-line no-shadow

	// load white background
	showLoader();
	// set progress bar to 22 to show progress
	// setProgressBar(22);

	var ticker = loaderTick(2, 100, 150);

	$.when(
		queryShoppingStage(viewId, startDate, endDate, deviceCategory, userType),
		queryUsers(viewId, startDate, endDate, deviceCategory, userType),
		queryNonBounce(viewId, startDate, endDate, deviceCategory, userType)

	).then(function(shoppingStageRes, usersRes, nonBounceRes) {

		var shoppingStageResult = 0;

		if(shoppingStageRes.result.reports[0].data.rows !== undefined){
			shoppingStageResult = shoppingStageRes.result.reports[0].data.rows.length;
		}

		var trend = 0;

		// Handle results from queryShoppingStage
		// Loop through rows in the shoppingStage object
		for (var i = 0; i < shoppingStageResult; i++) {

			console.log(shoppingStageRes.result.reports[0].data.rows[i]);

			// Dimension name is inherited into the variable 'dimensionName'
			var dimensionName = shoppingStageRes.result.reports[0].data.rows[i].dimensions[0];

			// Check if dimensionName is part of queryArray
			if (jQuery.inArray(dimensionName, queryArray) >= 0) {

				// If TRUE, add the value and name the object after the dimension name
				queryObj[dimensionName] = shoppingStageRes.result.reports[0].data.rows[i].metrics[0].values[0];
			}
		}

		queryObj.USERS = 0;

		console.log('Users (bounce & non bounce)');
		$.each(usersRes.result.reports[0].data.rows, function(key, value) {

			queryObj.USERS += Number(value.metrics[0].values[0]);

			var type = '';
			if (key === 0) {
				type = 'New users on desktop';
			} else if (key === 1) {
				type = 'New users on mobile';
			} else if (key === 2) {
				type = 'New users on tablet';
			} else if (key === 3) {
				type = 'Returning users on desktop';
			} else if (key === 4) {
				type = 'Returning users on mobile';
			} else if (key === 5) {
				type = 'Returning users on tablet';
			}
			console.log(type + ': ' + Number(value.metrics[0].values[0]));
		});

		console.log('Total users: ' + queryObj.USERS);
		console.log('All visits: ' + queryObj.ALL_VISITS);

		if (comparison) {

			$('#all-comparison').removeClass('hidden').html(queryObj.USERS);
			$('#all-trend').removeClass('hidden').html('-');

		} else {

			$('#all-users').addClass('').html(queryObj.USERS);
			$('#all-result').html('-');
			$('#all-comparison').addClass('hidden').html('');
			$('#all-trend').addClass('hidden').html('');
		}

		// handle result from queryUsers and push into query object
		//queryObj['USERS'] = usersRes.result.reports[0].data.rows[0].metrics[0].values[0];

		// handle result from queryNonBounce and push into query object
		queryObj.NON_BOUNCE_USERS = 0;

		console.log('Users (non bounce)');

		// Loop through the rows based on the required dimensions
		// (userType = new/returning, deviceCategory = mobile/tablet/desktop)
		$.each(nonBounceRes.result.reports[0].data.rows, function(key, value) {

			queryObj.NON_BOUNCE_USERS += Number(value.metrics[0].values[0]);

			var type = '';
			if (key === 0) {
				type = 'New users on desktop';
			} else if (key === 1) {
				type = 'New users on mobile';
			} else if (key === 2) {
				type = 'New users on tablet';
			} else if (key === 3) {
				type = 'Returning users on desktop';
			} else if (key === 4) {
				type = 'Returning users on mobile';
			} else if (key === 5) {
				type = 'Returning users on tablet';
			}
			console.log(type + ': ' + Number(value.metrics[0].values[0]));
		});

		// Calculate engagement rate
		var engagementRate = getPercent(queryObj.NON_BOUNCE_USERS, queryObj.USERS);

		if (checkIfNaN(engagementRate)) {
			return false;
		}

		console.log('Total non bounce users: ' + queryObj.NON_BOUNCE_USERS);

		var engagementRateBenchmark = [0, 50, 71];

		// If a comparison period is chosen, calculate diff (trend) and show table
		if (comparison) {

			trend = getTrend(engagementResult, engagementRate);

			setComparison('engagement', engagementRate, trend, engagementRateBenchmark);
			$('#result-table').removeClass('hidden');

		} else {

			engagementResult = engagementRate;

			setResult('engagement', engagementRate, engagementRateBenchmark, queryObj.NON_BOUNCE_USERS);
			$('#result-table').removeClass('hidden');
		}

		// Calculate finding rate
		var findRate = getPercent(queryObj.PRODUCT_VIEW, queryObj.NON_BOUNCE_USERS);

		console.log(findRate);

		if (checkIfNaN(findRate)) {
			return false;
		}

		var findRateBenchmark = [0, 60, 81];

		if (comparison) {

			trend = getTrend(findResult, findRate);

			setComparison('find', findRate, trend, findRateBenchmark);

		} else {

			findResult = findRate;

			setResult('find', findRate, findRateBenchmark, queryObj.PRODUCT_VIEW);
		}

		// Calculate product page effectiveness rate
		var productPageEffectivenessRate = getPercent(queryObj.ADD_TO_CART, queryObj.PRODUCT_VIEW);

		if (checkIfNaN(productPageEffectivenessRate)) {
			return false;
		}

		var productPageEffectivenessRateBenchmark = [0, 15, 21];

		if (comparison) {

			trend = getTrend(effectivenessResult, productPageEffectivenessRate);

			setComparison('effectiveness', productPageEffectivenessRate, trend, productPageEffectivenessRateBenchmark);

		} else {

			effectivenessResult = productPageEffectivenessRate;

			setResult('effectiveness', productPageEffectivenessRate, productPageEffectivenessRateBenchmark, queryObj.ADD_TO_CART);
		}

		// Calculate checkout rate
		var checkoutRate = getPercent(queryObj.CHECKOUT, queryObj.ADD_TO_CART);

		var checkoutRateBenchmark = [0, 60, 81];

		if (comparison) {

			trend = getTrend(beginCheckoutResult, checkoutRate);

			setComparison('begin-checkout', checkoutRate, trend, checkoutRateBenchmark);

		} else {

			beginCheckoutResult = checkoutRate;

			setResult('begin-checkout', checkoutRate, checkoutRateBenchmark, queryObj.CHECKOUT);
		}

		// Calculate checkout completion rate
		var checkoutCompletionRate = getPercent(queryObj.TRANSACTION, queryObj.CHECKOUT);

		var checkoutCompletionRateBenchmark = [0, 40, 61];

		if (comparison) {

			trend = getTrend(completeCheckoutResult, checkoutCompletionRate);

			setComparison('complete-checkout', checkoutCompletionRate, trend, checkoutCompletionRateBenchmark);

		} else {

			completeCheckoutResult = checkoutCompletionRate;

			setResult('complete-checkout', checkoutCompletionRate, checkoutCompletionRateBenchmark, queryObj.TRANSACTION);
		}

		// Calculate cart abandonment rate
		// var cartAbandonmentRate = Math.round((1 - (queryObj.TRANSACTION / queryObj.CHECKOUT)) * 100);

		//console.log(queryObj);
		$('#canvas').removeClass('hidden');
		$('#click-blocks').removeClass('hidden');

		// If there's no comparison date chosen, draw the funnel
		if (!comparison) {
			var data = [
				['Stay on site', engagementRate, setBenchmarkColor(engagementRate, engagementRateBenchmark)],
				['Finding product', findRate, setBenchmarkColor(findRate, findRateBenchmark)],
				['Add to cart', productPageEffectivenessRate, setBenchmarkColor(productPageEffectivenessRate, productPageEffectivenessRateBenchmark)],
				['Begin checkout', checkoutRate, setBenchmarkColor(checkoutRate, checkoutRateBenchmark)],
				['Complete checkout', checkoutCompletionRate, setBenchmarkColor(checkoutCompletionRate, checkoutCompletionRateBenchmark)]
			];

			console.log(data);

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
					barOverlay: false,
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
								swal({
									title: 'Stay on site',
									text: 'Is calculated based on <i>Engagement rate</i> (opposite of bounce rate). Meaning, users who interacted with your site by visiting more than one page or triggered some kind of interaction event.<br><br><span style="color:#65B739;"><b>Good: 70-100%</b></span><br><span style="color:#ffc933;"><b>OK: 50-70%</b></span><br><span style="color:#c61618;"><b>Bad: 0-50%</b></span>',
									html: true
								});
							} else if (d.index === 1) {
								swal({
									title: 'Find products',
									text: 'Is calculated based on <i>Finding rate</i>. Meaning, how many users (out of the stay-on-site-users) who visited at least one product page.<br><br><span style="color:#65B739;"><b>Good: 80-100%</b></span><br><span style="color:#ffc933;"><b>OK: 60-80%</b></span><br><span style="color:#c61618;"><b>Bad: 0-60%</b></span>',
									html: true
								});
							} else if (d.index === 2) {
								swal({
									title: 'Add to cart',
									text: 'Is calculated based on <i>Product page effectiveness rate</i>. Meaning, how many users (out of the find-products-users) who added an item to the shopping cart.<br><br><span style="color:#65B739;"><b>Good: 20-100%</b></span><br><span style="color:#ffc933;"><b>OK: 15-20%</b></span><br><span style="color:#c61618;"><b>Bad: 0-15%</b></span>',
									html: true
								});
							} else if (d.index === 3) {
								swal({
									title: 'Begin checkout',
									text: 'Is calculated based on <i>Checkout rate</i>. Meaning, how many users (out of the add-to-cart-users) who proceeded to visit the checkout page.<br><br><span style="color:#65B739;"><b>Good: 80-100%</b></span><br><span style="color:#ffc933;"><b>OK: 60-80%</b></span><br><span style="color:#c61618;"><b>Bad: 0-60%</b></span>',
									html: true
								});
							} else if (d.index === 4) {
								swal({
									title: 'Complete checkout',
									text: 'Is calculated based on <i>Checkout completion rate</i>. Meaning, how many users (out of the begin-checkout-users) who completed their purchase.<br><br><span style="color:#65B739;"><b>Good: 60-100%</b></span><br><span style="color:#ffc933;"><b>OK: 40-60%</b></span><br><span style="color:#c61618;"><b>Bad: 0-40%</b></span>',
									html: true
								});
							}
						}
					}
				}
			};
			const chart = new D3Funnel('#funnel');
			chart.draw(data, options);
		}

		clearInterval(ticker);
		setProgressBar(100);
		hideLoader();
	});
}

// API call for all users
function queryUsers(viewId, startDate, endDate, deviceCategory, userType) { // eslint-disable-line no-shadow

	var deviceCategoryArray = [];

	if (deviceCategory === 'all') {
		deviceCategoryArray.push('desktop');
		deviceCategoryArray.push('tablet');
		deviceCategoryArray.push('mobile');
	} else {
		deviceCategoryArray.push(deviceCategory);
	}

	var userTypeArray = [];

	if (userType === 'all') {
		userTypeArray.push('New Visitor');
		userTypeArray.push('Returning Visitor');
	} else {
		userTypeArray.push(userType);
	}

	var result = gapi.client.request({
		path: '/v4/reports:batchGet',
		root: 'https://analyticsreporting.googleapis.com/',
		method: 'POST',
		body: {

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
				dimensions: [{
					name: 'ga:userType'
				}, {
					name: 'ga:deviceCategory'
				}],
				dimensionFilterClauses: [{
					operator: 'AND',
					filters: [{
						dimensionName: 'ga:userType',
						operator: 'IN_LIST',
						expressions: userTypeArray
					}, {
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
function queryNonBounce(viewId, startDate, endDate, deviceCategory, userType) { // eslint-disable-line no-shadow

	var deviceCategoryArray = [];

	if (deviceCategory === 'all') {
		deviceCategoryArray.push('desktop');
		deviceCategoryArray.push('tablet');
		deviceCategoryArray.push('mobile');
	} else {
		deviceCategoryArray.push(deviceCategory);
	}

	var userTypeArray = [];

	if (userType === 'all') {
		userTypeArray.push('New Visitor');
		userTypeArray.push('Returning Visitor');
	} else {
		userTypeArray.push(userType);
	}

	var result = gapi.client.request({
		path: '/v4/reports:batchGet',
		root: 'https://analyticsreporting.googleapis.com/',
		method: 'POST',
		body: {
			reportRequests: [{
				dateRanges: [{
					endDate: endDate,
					startDate: startDate
				}],
				metrics: [{
					expression: 'ga:users'
				}],
				samplingLevel: 'LARGE',
				viewId: viewId,
				dimensions: [{
					name: 'ga:segment'
				}, {
					name: 'ga:userType'
				}, {
					name: 'ga:deviceCategory'
				}],
				dimensionFilterClauses: [{
					operator: 'AND',
					filters: [{
						dimensionName: 'ga:userType',
						operator: 'IN_LIST',
						expressions: userTypeArray
					}, {
						dimensionName: 'ga:deviceCategory',
						operator: 'IN_LIST',
						expressions: deviceCategoryArray
					}]
				}],
				segments: [{
					dynamicSegment: {
						name: 'non_bounces',
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
function queryShoppingStage(viewId, startDate, endDate, deviceCategory, userType) { // eslint-disable-line no-shadow

	var deviceCategoryArray = [];

	if (deviceCategory === 'all') {
		deviceCategoryArray.push('desktop');
		deviceCategoryArray.push('tablet');
		deviceCategoryArray.push('mobile');
	} else {
		deviceCategoryArray.push(deviceCategory);
	}

	var userTypeArray = [];

	if (userType === 'all') {
		userTypeArray.push('New Visitor');
		userTypeArray.push('Returning Visitor');
	} else {
		userTypeArray.push(userType);
	}

	var result = gapi.client.request({
		path: '/v4/reports:batchGet',
		root: 'https://analyticsreporting.googleapis.com/',
		method: 'POST',
		body: {
			reportRequests: [{
				dateRanges: [{
					endDate: endDate,
					startDate: startDate
				}],
				samplingLevel: 'LARGE',
				metrics: [{
					expression: 'ga:users'
				}],
				viewId: viewId,
				dimensions: [{
					name: 'ga:shoppingStage'
				}, {
					name: 'ga:segment'
				}],
				dimensionFilterClauses: [{
					operator: 'AND',
					filters: [{
						dimensionName: 'ga:userType',
						operator: 'IN_LIST',
						expressions: userTypeArray
					}, {
						dimensionName: 'ga:deviceCategory',
						operator: 'IN_LIST',
						expressions: deviceCategoryArray
					}]
				}],
				segments: [{
					dynamicSegment: {
						name: 'non_bounces',
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

function getPercent(val1, val2) {
	var res = Math.round((val1 / val2) * 100);
	return res;
}

function getTrend(val1, val2) {
	var res = Math.round(val1 - val2);
	return res;
}

// Handle the authorization
function authorize(event) {
	// 'immediate' should be false when invoked from the button click.
	var useImmdiate = event ? false : true;
	var authData = {

		client_id: CLIENT_ID, // eslint-disable-line camelcase
		scope: SCOPES,
		immediate: useImmdiate
	};

	gapi.auth.authorize(authData, function(response) {

		var authButton = document.getElementById('auth-button');

		if (response.error) {
			authButton.hidden = false;

			showAuthDialog();
		} else {
			authButton.hidden = true;
			console.log('inloggad');
			if(ecomFunnel === null) {
				$('#modalSettings').modal('show');
			}
			queryAccounts();
		}
	});
}

function showAuthDialog() {
	swal({
		title: 'GA Authorization',
		html: true,
		text: 'We\'ll need permission to access your Google Analytics account.<br />',
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

function queryAccounts() {

	// Load the Google Analytics client library
	gapi.client.load('analytics', 'v3').then(function() {

		// Get a list of all Google Analytics accounts for this user
		gapi.client.analytics.management.accounts.list().then(handleAccounts);
	});

	// Get user name and email
	gapi.client.load('plus', 'v1', function(){
		var request = gapi.client.plus.people.get({
		'userId': 'me'
		});
		request.execute(function(resp) {
			var name = resp.displayName;
			var email = handleEmailResponse(resp);

			sendUserData(name, email);
			console.log('Retrieved profile for:' + name + ', ' + email);
		});
	});
}

function handleEmailResponse(resp) {

	var primaryEmail;

	for (var i = 0; i < resp.emails.length; i++) {
		if (resp.emails[i].type === 'account'){
			primaryEmail = resp.emails[i].value;
		}
	}

	return primaryEmail;

}

function sendUserData(name, email) {

	if (typeof analytics !== 'undefined') {
		console.log(name + '\n' + email);
		analytics.identify({
			name: name,
			email: email
		});
	}
}

function handleAccounts(response) {

	// Handles the response from the accounts list method
	if (response.result.items && response.result.items.length) {

		$('#accountId').html('<option selected="selected" disabled="true">-- Please select -- </option>').attr('disabled', false);

		$.each(response.result.items, function(index, val) {

			if (val.id === accountId) {

				var selected = true;

			} else {

				selected = false;
			}

			$('#accountId').append($('<option/>', {
				value: val.id,
				text: val.name,
				selected: selected
			}));
		});

		// Get the first Google Analytics account
		if (!accountId) {
			accountId = response.result.items[0].id;
		}

		// Query for properties
		queryProperties(accountId);

	} else {
		console.log('No accounts found for this user.');
	}
}

function queryProperties(accountId) { // eslint-disable-line no-shadow
	// Get a list of all the properties for the account
	gapi.client.analytics.management.webproperties.list({ 'accountId': accountId })
	.then(handleProperties).then(null, function(err) {
			// Log any errors.
			console.log(err);
	});
}

function handleProperties(response) {
	// Handles the response from the webproperties list method
	if (response.result.items && response.result.items.length) {

		$('#propertyId').html('<option selected="selected" disabled="true">-- Please select -- </option>').attr('disabled', false);

		$.each(response.result.items, function(index, val) {

			var selected = null;

			if (val.id === propertyId) {

				selected = true;

			} else {

				selected = false;
			}

			$('#propertyId').append($('<option/>', {
				value: val.id,
				text: val.name,
				selected: selected
			}));
		});

		if (!propertyId) {
			propertyId = response.result.items[0].id;
		}

		// Query for Views (Profiles)
		queryProfiles(accountId, propertyId);
	} else {
		console.log('No properties found for this user.');
	}
}

function queryProfiles(accountId, propertyId) { // eslint-disable-line no-shadow
	// Get a list of all Views (Profiles) for the first property of the first Account
	gapi.client.analytics.management.profiles.list({
		'accountId': accountId,
		'webPropertyId': propertyId
	})
	.then(handleProfiles).then(null, function(err) {
		// Log any errors.
		console.log(err);
	});
}

function handleProfiles(response) {
	// Handles the response from the profiles list method.
	if (response.result.items && response.result.items.length) {

		$('#viewId').html('<option selected="selected" disabled="true">-- Please select -- </option>').attr('disabled', false);
		$.each(response.result.items, function(index, val) {

			if (val.id === viewId) {

				var selected = true;
				$('#get-funnel-btn').prop('disabled', false);
				$('#save-settings-btn').prop('disabled', false);

				$('#selected-account').text(val.name);

			} else {

				selected = false;
			}

			$('#viewId').append($('<option/>', {
				value: val.id,
				text: val.name,
				selected: selected
			}));
		});

	} else {
		console.log('No views (profiles) found for this user.');
	}
}

// Saves stringified object to selected position in local storage
function saveLocal(name, obj) {
	localStorage.setItem(name, JSON.stringify(obj));
}

// Get and return parsed object from selected position in local storage
function readLocal(name) {
	var data = JSON.parse(localStorage.getItem(name));
	return data;
}

// Find and update keys and values in object
function updateLocal(name, k, v) {
	var data = readLocal(name);

	if (data === null) {
		data = {};
	}

	data[k] = v;

	saveLocal(name, data);
}

function setResult(string, val, benchmark, users) {

	var symbol = setBenchmarkSymbol(val, benchmark);

	$('#' + string + '-result').addClass('').html(val + '%' + symbol);
	$('#' + string + '-users').addClass('').html(users);
	$('#th-comparison, #th-trend').addClass('hidden');
	$('#' + string + '-comparison').removeClass('').addClass('hidden').html('');
	$('#' + string + '-trend').removeClass('').addClass('hidden').html('');
}

function removeResult() {

	$('[id$="-result"]').html('');
	$('[id$="-users"]').html('');
	$('#th-comparison, #th-trend').addClass('hidden');
	$('[id$="-comparison"]').removeClass('').addClass('hidden').html('');
	$('[id$="-trend"]').removeClass('').addClass('hidden').html('');

	$('#get-funnel-btn').text('Create Your Funnel');

	$('#funnel').html('<img class="img-responsive" src="images/empty-funnel-opacity50.png">');

}

function setComparison(string, val1, val2, benchmark) {

	var benchSymbol = setBenchmarkSymbol(val1, benchmark);
	var trendSymbol = setTrendSymbol(val2);

	$('#th-comparison, #th-trend').removeClass('hidden');
	$('#' + string + '-comparison').removeClass('hidden').addClass('').html(val1 + '%' + benchSymbol);
	$('#' + string + '-trend').removeClass('hidden').addClass('').html(val2 + '%' + trendSymbol);
}

// Needle = API value. Haystack = benchmark array
function setBenchmarkColor(apiValue, benchmarkValues) {

	var position = 0;

	// Loop through benchmark array.
	$.each(benchmarkValues, function(key, val) {
		// If API value is greater than or equals loop value,
		// the position variable inherits the position of the value in the array
		if (apiValue >= val) {

			position = key;
		}
	});

	var color = '';

	if (position === 0) {

		color = '#C12107';

	} else if (position === 1) {

		color = '#F4CD24';

	} else if (position === 2) {

		color = '#65B739';
	}

	return color;
}

// Needle = API value. Haystack = benchmark array
function setBenchmarkSymbol(apiValue, benchmarkValues) {

	var position = 0;

	// Loop through benchmark array.
	$.each(benchmarkValues, function(key, val) {
		// If API value is greater than or equals loop value,
		// the position variable inherits the position of the value in the array
		if (apiValue >= val) {

			position = key;
		}
	});

	var symbol = '';

	if (position === 0) {

		symbol = '<span class="text-danger glyphicon glyphicon-exclamation-sign btn-xs" aria-hidden="true"></span>';

	} else if (position === 1) {

		symbol = '<span class="text-warning glyphicon glyphicon-eye-open btn-xs" aria-hidden="true"></span>';

	} else if (position === 2) {

		symbol = '<span class="text-success glyphicon glyphicon-ok btn-xs" aria-hidden="true"></span>';
	}

	return symbol;
}

function setTrendSymbol(val2) {

	var trendSymbol = '';

	if (val2 === 0) {

		trendSymbol = '<span class="invisible glyphicon glyphicon-triangle-top btn-xs" aria-hidden="true"></span>';

	} else if (val2 > 0) {

		trendSymbol = '<span class="text-success glyphicon glyphicon-triangle-top btn-xs" aria-hidden="true"></span>';

	} else if (val2 < 0) {

		trendSymbol = '<span class="text-danger glyphicon glyphicon-triangle-bottom btn-xs" aria-hidden="true"></span>';
	}

	return trendSymbol;

}

// Checks if any of the metrics returns a NaN
function checkIfNaN(val) {

	var output = false;

	if (isNaN(val)) {

		setProgressBar(100);
		hideLoader();

		swal({
			title: 'Oops!',
			html: true,
			text: 'It seems your website doesn\'t have enhanced ecommerce tracking in place.<br><a href="mailto:martin@conversionista.se">Please contact us for help!</a>',
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

function hideLoader(){

	$('#loader').fadeOut(200);
}

function showLoader(){

	$('#loader').fadeIn(200);
}

// to set progress bar to specific value
function setProgressBar(value) {

	// set body and .pace classes to show pace progress bar by changing classes
	$('body').removeClass('pace-done').addClass('pace-running');
	$('.pace').removeClass('pace-inactive').addClass('pace-active');

	// insert the selected value into attribute "data-progress-text" and change the styling to the same value (see css from pace.js)
	$('.pace-progress').attr('data-progress-text', value + '%').attr('style', 'transform: translate3d(' + value + '%, 0px, 0px);');

	// if value is 100 the load bar is complete and gets removed by altering body and .pace classes
	if(value === 100) {
		$('body').removeClass('pace-running').addClass('pace-done');
		$('.pace').removeClass('pace-active').addClass('pace-inactive');
	}
}

function loaderTick(startVal, stopVal, ms){

	var newVal = startVal;

	var loaderStatus = setInterval(function(){

		if (newVal <= stopVal){
			$('.pace-progress').attr('data-progress-text', newVal + '%').attr('style', 'transform: translate3d(' + newVal + '%, 0px, 0px);');

			newVal++;
		}

	}, ms);

	return loaderStatus;
}

