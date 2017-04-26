"use strict";function apiResponse(e,t,a,n,s,o){showLoader();var r=loaderTick(2,100,300);$.when(queryShoppingStage(e,t,a,n,s,!1),queryShoppingStage(e,t,a,n,s,!0)).then(function(e,t){var a=!1,n=!1;"undefined"!=typeof t.result.reports[0].data.samplesReadCounts&&(a=t.result.reports[0].data.samplesReadCounts[0]),"undefined"!=typeof t.result.reports[0].data.samplingSpaceSizes&&(n=t.result.reports[0].data.samplingSpaceSizes[0]),a&&n?$("#sampled-data-notification, #sample-star").removeClass("hidden"):$("#sampled-data-notification, #sample-star").addClass("hidden");var s=0;if(void 0===t.result.reports[0].data.rows)return checkIfNaN("bööös"),!1;s=t.result.reports[0].data.rows.length;for(var i=0,l=0;l<s;l++){var c=t.result.reports[0].data.rows[l].dimensions[0];jQuery.inArray(c,queryArray)>=0&&(queryObj[c]=t.result.reports[0].data.rows[l].metrics[0].values[0])}if(void 0===e.result.reports[0].data.rows[3])return checkIfNaN("bööös"),!1;queryObj.USERS=e.result.reports[0].data.rows[3].metrics[0].values[0],o?($("#all-comparison").removeClass("hidden").html(queryObj.USERS),$("#all-trend").removeClass("hidden").html("-")):($("#all-users").addClass("").html(queryObj.USERS),$("#all-result").html("-"),$("#all-comparison").addClass("hidden").html(""),$("#all-trend").addClass("hidden").html("")),queryObj.NON_BOUNCE_USERS=t.result.reports[0].data.rows[3].metrics[0].values[0];var d=getPercent(queryObj.NON_BOUNCE_USERS,queryObj.USERS);if(checkIfNaN(d))return!1;var u=[0,60,71];o?(i=getTrend(engagementResult,d),setComparison("engagement",d,i,u),$("#result-table").removeClass("hidden")):(engagementResult=d,setResult("engagement",d,u,queryObj.NON_BOUNCE_USERS),$("#result-table").removeClass("hidden"));var p=getPercent(queryObj.PRODUCT_VIEW,queryObj.NON_BOUNCE_USERS);if(checkIfNaN(p))return!1;var m=[0,50,66];o?(i=getTrend(findResult,p),setComparison("find",p,i,m)):(findResult=p,setResult("find",p,m,queryObj.PRODUCT_VIEW));var h=getPercent(queryObj.ADD_TO_CART,queryObj.PRODUCT_VIEW);if(checkIfNaN(h))return!1;var g=[0,10,21];o?(i=getTrend(effectivenessResult,h),setComparison("effectiveness",h,i,g)):(effectivenessResult=h,setResult("effectiveness",h,g,queryObj.ADD_TO_CART));var f=getPercent(queryObj.CHECKOUT,queryObj.ADD_TO_CART),b=[0,50,81];o?(i=getTrend(beginCheckoutResult,f),setComparison("begin-checkout",f,i,b)):(beginCheckoutResult=f,setResult("begin-checkout",f,b,queryObj.CHECKOUT));var v=getPercent(queryObj.TRANSACTION,queryObj.CHECKOUT),y=[0,50,66];if(o?(i=getTrend(completeCheckoutResult,v),setComparison("complete-checkout",v,i,y)):(completeCheckoutResult=v,setResult("complete-checkout",v,y,queryObj.TRANSACTION)),$("#canvas").removeClass("hidden"),$("#click-blocks").removeClass("hidden"),!o){var C=[["Stay on site",d,setBenchmarkColor(d,u)],["Finding product",p,setBenchmarkColor(p,m)],["Add to cart",h,setBenchmarkColor(h,g)],["Begin checkout",f,setBenchmarkColor(f,b)],["Complete checkout",v,setBenchmarkColor(v,y)]],D={chart:{width:"100%",height:350,bottomPinch:0,animate:100,curve:{enabled:!0,height:20}},block:{dynamicHeight:!1,highlight:!0,barOverlay:!1,fill:{type:"gradient"}},label:{format:"{f}%"},events:{click:{block:function(e){0===e.index?swal({title:"Stay on site",text:'Is calculated based on <i>Engagement rate</i> (opposite of bounce rate). Meaning, users who interacted with your site by visiting more than one page or triggered some kind of interaction event.<br><br><span style="color:#65B739;"><b>Good: 71-100%</b></span><br><span style="color:#ffc933;"><b>OK: 60-70%</b></span><br><span style="color:#c61618;"><b>Bad: 0-59%</b></span><p class="popup-info">(Average benchmark, all devices)</p>',html:!0}):1===e.index?swal({title:"Find products",text:'Is calculated based on <i>Finding rate</i>. Meaning, how many users (out of the stay-on-site-users) who visited at least one product page.<br><br><span style="color:#65B739;"><b>Good: 66-100%</b></span><br><span style="color:#ffc933;"><b>OK: 50-65%</b></span><br><span style="color:#c61618;"><b>Bad: 0-49%</b></span><p class="popup-info">(Average benchmark, all devices)</p>',html:!0}):2===e.index?swal({title:"Add to cart",text:'Is calculated based on <i>Product page effectiveness rate</i>. Meaning, how many users (out of the find-products-users) who added an item to the shopping cart.<br><br><span style="color:#65B739;"><b>Good: 21-100%</b></span><br><span style="color:#ffc933;"><b>OK: 10-20%</b></span><br><span style="color:#c61618;"><b>Bad: 0-9%</b></span><p class="popup-info">(Average benchmark, all devices)</p>',html:!0}):3===e.index?swal({title:"Begin checkout",text:'Is calculated based on <i>Checkout rate</i>. Meaning, how many users (out of the add-to-cart-users) who proceeded to visit the checkout page.<br><br><span style="color:#65B739;"><b>Good: 81-100%</b></span><br><span style="color:#ffc933;"><b>OK: 50-80%</b></span><br><span style="color:#c61618;"><b>Bad: 0-49%</b></span><p class="popup-info">(Average benchmark, all devices)</p>',html:!0}):4===e.index&&swal({title:"Complete checkout",text:'Is calculated based on <i>Checkout completion rate</i>. Meaning, how many users (out of the begin-checkout-users) who completed their purchase.<br><br><span style="color:#65B739;"><b>Good: 66-100%</b></span><br><span style="color:#ffc933;"><b>OK: 50-65%</b></span><br><span style="color:#c61618;"><b>Bad: 0-49%</b></span><p class="popup-info">(Average benchmark, all devices)</p>',html:!0})}}}},I=new D3Funnel("#funnel");I.draw(C,D)}0!==comparisonStartDate?o&&(clearInterval(r),setProgressBar(100),hideLoader()):(clearInterval(r),setProgressBar(100),hideLoader())})}function queryShoppingStage(e,t,a,n,s,o){var r=[];"all"===n?(r.push("desktop"),r.push("tablet"),r.push("mobile")):r.push(n);var i=[];"all"===s?(i.push("New Visitor"),i.push("Returning Visitor")):i.push(s);var l="";return l=o?gapi.client.request({path:"/v4/reports:batchGet",root:"https://analyticsreporting.googleapis.com/",method:"POST",body:{reportRequests:[{dateRanges:[{endDate:a,startDate:t}],samplingLevel:"LARGE",metrics:[{expression:"ga:users"}],viewId:e,dimensions:[{name:"ga:shoppingStage"},{name:"ga:segment"}],dimensionFilterClauses:[{operator:"AND",filters:[{dimensionName:"ga:userType",operator:"IN_LIST",expressions:i},{dimensionName:"ga:deviceCategory",operator:"IN_LIST",expressions:r}]}],segments:[{dynamicSegment:{name:"non_bounces",sessionSegment:{segmentFilters:[{simpleSegment:{orFiltersForSegment:[{segmentFilterClauses:[{metricFilter:{metricName:"ga:bounces",operator:"EQUAL",comparisonValue:"0"}}]}]}}]}}}]}]}}):gapi.client.request({path:"/v4/reports:batchGet",root:"https://analyticsreporting.googleapis.com/",method:"POST",body:{reportRequests:[{dateRanges:[{endDate:a,startDate:t}],samplingLevel:"LARGE",metrics:[{expression:"ga:users"}],viewId:e,dimensions:[{name:"ga:shoppingStage"}],dimensionFilterClauses:[{operator:"AND",filters:[{dimensionName:"ga:userType",operator:"IN_LIST",expressions:i},{dimensionName:"ga:deviceCategory",operator:"IN_LIST",expressions:r}]}]}]}})}function getPercent(e,t){var a=Math.round(e/t*100);return a}function getTrend(e,t){var a=Math.round(e-t);return a}function authorize(e){var t=!e,a={client_id:CLIENT_ID,scope:SCOPES,immediate:t};gapi.auth.authorize(a,function(e){var t=document.getElementById("auth-button");e.error?(t.hidden=!1,showAuthDialog()):(t.hidden=!0,null===ecomFunnel&&$("#modalSettings").modal("show"),queryAccounts())})}function showAuthDialog(){swal({title:"GA Authorization",html:!0,text:"We'll need permission to access your Google Analytics account.<br />",imageUrl:"images/google-analytics-logo.png",confirmButtonText:"Authorize",confirmButtonColor:"#5cb85c",customClass:"authorize",showCancelButton:!1}),$(".authorize .confirm").click(function(e){$(this).html('<i class="fa fa-cog fa-spin"></i>').attr("disabled",!0),authorize(e)})}function queryAccounts(){gapi.client.load("analytics","v3").then(function(){gapi.client.analytics.management.accounts.list().then(handleAccounts)}),gapi.client.load("plus","v1",function(){var e=gapi.client.plus.people.get({userId:"me"});e.execute(function(e){var t=e.displayName,a=handleEmailResponse(e);sendUserData(t,a)})})}function handleEmailResponse(e){for(var t,a=0;a<e.emails.length;a++)"account"===e.emails[a].type&&(t=e.emails[a].value);return t}function sendUserData(e,t){"undefined"!=typeof analytics&&analytics.identify({name:e,email:t})}function handleAccounts(e){e.result.items&&e.result.items.length?($("#accountId").html('<option selected="selected" disabled="true">-- Please select -- </option>').attr("disabled",!1),$.each(e.result.items,function(e,t){if(t.id===accountId)var a=!0;else a=!1;$("#accountId").append($("<option/>",{value:t.id,text:t.name,selected:a}))}),accountId||(accountId=e.result.items[0].id),queryProperties(accountId)):console.log("No accounts found for this user.")}function queryProperties(e){gapi.client.analytics.management.webproperties.list({accountId:e}).then(handleProperties).then(null,function(e){console.log(e)})}function handleProperties(e){e.result.items&&e.result.items.length?($("#propertyId").html('<option selected="selected" disabled="true">-- Please select -- </option>').attr("disabled",!1),$.each(e.result.items,function(e,t){var a=null;a=t.id===propertyId,$("#propertyId").append($("<option/>",{value:t.id,text:t.name,selected:a}))}),propertyId||(propertyId=e.result.items[0].id),queryProfiles(accountId,propertyId)):console.log("No properties found for this user.")}function queryProfiles(e,t){gapi.client.analytics.management.profiles.list({accountId:e,webPropertyId:t}).then(handleProfiles).then(null,function(e){console.log(e)})}function handleProfiles(e){e.result.items&&e.result.items.length?($("#viewId").html('<option selected="selected" disabled="true">-- Please select -- </option>').attr("disabled",!1),$.each(e.result.items,function(e,t){if(t.id===viewId){var a=!0;$("#get-funnel-btn").prop("disabled",!1),$("#save-settings-btn").prop("disabled",!1),$("#selected-account").text(t.name)}else a=!1;$("#viewId").append($("<option/>",{value:t.id,text:t.name,selected:a}))})):console.log("No views (profiles) found for this user.")}function saveLocal(e,t){localStorage.setItem(e,JSON.stringify(t))}function readLocal(e){var t=JSON.parse(localStorage.getItem(e));return t}function updateLocal(e,t,a){var n=readLocal(e);null===n&&(n={}),n[t]=a,saveLocal(e,n)}function setResult(e,t,a,n){var s=setBenchmarkSymbol(t,a);$("#"+e+"-result").addClass("").html(t+"%"+s),$("#"+e+"-users").addClass("").html(n),$("#th-comparison, #th-trend").addClass("hidden"),$("#"+e+"-comparison").removeClass("").addClass("hidden").html(""),$("#"+e+"-trend").removeClass("").addClass("hidden").html("")}function removeResult(){$('[id$="-result"]').html(""),$('[id$="-users"]').html(""),$("#th-comparison, #th-trend").addClass("hidden"),$('[id$="-comparison"]').removeClass("").addClass("hidden").html(""),$('[id$="-trend"]').removeClass("").addClass("hidden").html(""),$("#get-funnel-btn").text("Create Your Funnel"),$("#funnel").html('<img class="img-responsive" src="images/empty-funnel-opacity50.png">')}function setComparison(e,t,a,n){var s=setBenchmarkSymbol(t,n),o=setTrendSymbol(a);$("#th-comparison, #th-trend").removeClass("hidden"),$("#"+e+"-comparison").removeClass("hidden").addClass("").html(t+"%"+s),$("#"+e+"-trend").removeClass("hidden").addClass("").html(a+"%"+o)}function setBenchmarkColor(e,t){var a=0;$.each(t,function(t,n){e>=n&&(a=t)});var n="";return 0===a?n="#C12107":1===a?n="#F4CD24":2===a&&(n="#65B739"),n}function setBenchmarkSymbol(e,t){var a=0;$.each(t,function(t,n){e>=n&&(a=t)});var n="";return 0===a?n='<span class="text-danger glyphicon glyphicon-exclamation-sign btn-xs" aria-hidden="true"></span>':1===a?n='<span class="text-warning glyphicon glyphicon-eye-open btn-xs" aria-hidden="true"></span>':2===a&&(n='<span class="text-success glyphicon glyphicon-ok btn-xs" aria-hidden="true"></span>'),n}function setTrendSymbol(e){var t="";return 0===e?t='<span class="invisible glyphicon glyphicon-triangle-top btn-xs" aria-hidden="true"></span>':e>0?t='<span class="text-success glyphicon glyphicon-triangle-top btn-xs" aria-hidden="true"></span>':e<0&&(t='<span class="text-danger glyphicon glyphicon-triangle-bottom btn-xs" aria-hidden="true"></span>'),t}function checkIfNaN(e){var t=!1;return isNaN(e)&&(setProgressBar(100),hideLoader(),swal({title:"Oops!",html:!0,text:'It seems your website doesn\'t have enhanced ecommerce tracking in place.<br><a href="mailto:martin@conversionista.se">Please contact us for help!</a>',imageUrl:"images/google-analytics-logo.png",confirmButtonText:"OK :(",confirmButtonColor:"#5cb85c",customClass:"authorize",showCancelButton:!1}),t=!0),t}function hideLoader(){$("#loader").fadeOut(200)}function showLoader(){$("#loader").fadeIn(200)}function setProgressBar(e){$("body").removeClass("pace-done").addClass("pace-running"),$(".pace").removeClass("pace-inactive").addClass("pace-active"),$(".pace-progress").attr("data-progress-text",e+"%").attr("style","transform: translate3d("+e+"%, 0px, 0px);"),100===e&&($("body").removeClass("pace-running").addClass("pace-done"),$(".pace").removeClass("pace-active").addClass("pace-inactive"))}function loaderTick(e,t,a){var n=e,s=setInterval(function(){if(n<=t&&($(".pace-progress").attr("data-progress-text",n+"%").attr("style","transform: translate3d("+n+"%, 0px, 0px);"),n++,n>=100))return setProgressBar(100),hideLoader(),!1},a);return s}var ecomFunnel=readLocal("ecomFunnel");if(null!==ecomFunnel)var accountId=ecomFunnel.accountId,propertyId=ecomFunnel.propertyId,viewId=ecomFunnel.viewId;else accountId=!1,propertyId=!1,viewId=!1;var queryArray=["ALL_VISITS","PRODUCT_VIEW","ADD_TO_CART","CHECKOUT","TRANSACTION"],queryObj={},CLIENT_ID="856128908931-99pe52krvhcn0v81oie89b357gqvgamq.apps.googleusercontent.com",SCOPES=["https://www.googleapis.com/auth/analytics.readonly","https://www.googleapis.com/auth/plus.me","https://www.googleapis.com/auth/plus.profile.emails.read"],startDate=moment().subtract(31,"days").format("YYYY-MM-DD"),endDate=moment().subtract(1,"days").format("YYYY-MM-DD"),comparisonStartDate=0,comparisonEndDate=0,deviceCategory="",userType="",engagementResult=0,findResult=0,effectivenessResult=0,beginCheckoutResult=0,completeCheckoutResult=0;$(document).ready(function(){Pace.on("done",function(){hideLoader()}),$('input[name="daterange"]').daterangepicker({locale:{format:"YYYY-MM-DD",separator:" – ",applyLabel:"Apply",cancelLabel:"Cancel",fromLabel:"From",toLabel:"To",customRangeLabel:"Custom",weekLabel:"w. ",daysOfWeek:["Su","Mo","Tu","We","Th","Fr","Sa"],monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],firstDay:1},showISOWeekNumbers:!0,applyClass:"btn btn-success",cancelClass:"btn btn-danger",startDate:startDate,endDate:endDate}),$("#date-range").on("apply.daterangepicker",function(e,t){startDate=t.startDate.format("YYYY-MM-DD"),endDate=t.endDate.format("YYYY-MM-DD"),$("#date-range").val(t.startDate.format("YYYY-MM-DD")+" to "+t.endDate.format("YYYY-MM-DD"))}),$("#date-range").on("cancel.daterangepicker",function(){$("#date-range").val(startDate+" to "+endDate)}),$("#comparison-range").on("apply.daterangepicker",function(e,t){comparisonStartDate=t.startDate.format("YYYY-MM-DD"),comparisonEndDate=t.endDate.format("YYYY-MM-DD"),$("#comparison-range").val(t.startDate.format("YYYY-MM-DD")+" to "+t.endDate.format("YYYY-MM-DD"))}),$("#comparison-range").on("hide.daterangepicker",function(e,t){0===comparisonStartDate&&0===comparisonEndDate?$("#comparison-range").val(""):$("#comparison-range").val(t.startDate.format("YYYY-MM-DD")+" to "+t.endDate.format("YYYY-MM-DD"))}),$("#comparison-range").on("cancel.daterangepicker",function(){comparisonStartDate=0,comparisonEndDate=0,$("#comparison-range").val("")}),$("#date-range").val(startDate+" to "+endDate),$("#comparison-range").val(""),$("#save-settings-btn").on("click",function(e){e.preventDefault(),removeResult(),updateLocal("ecomFunnel","accountId",accountId),updateLocal("ecomFunnel","propertyId",propertyId),updateLocal("ecomFunnel","viewId",viewId)}),$("#get-funnel-btn").on("click",function(e){e.preventDefault(),setProgressBar(0),deviceCategory=$('input[name="deviceCategory"]:checked').val(),userType=$('input[name="userType"]:checked').val(),$.when(apiResponse(viewId,startDate,endDate,deviceCategory,userType)).then(function(){0!==comparisonStartDate&&0!==comparisonEndDate&&apiResponse(viewId,comparisonStartDate,comparisonEndDate,deviceCategory,userType,!0),$("#get-funnel-btn").text("Update result")})}),$("#accountId").on("change",function(){accountId=$(this).val(),queryProperties(accountId),$("#viewId").html('<option selected="selected" disabled="true">-- Please select -- </option>').attr("disabled",!1)}),$("#propertyId").on("change",function(){propertyId=$(this).val(),queryProfiles(accountId,propertyId)}),$("#viewId").on("change",function(){viewId=$(this).val();var e=$("#viewId option:selected").text();$("#get-funnel-btn").prop("disabled",!1),$("#save-settings-btn").prop("disabled",!1),$("#selected-account").text(e)}),$("#comparison-toggle").click(function(e){e.preventDefault(),$("#comparison-date").slideToggle(200,function(){$("#comparison-toggle i").toggleClass("fa-angle-down").toggleClass("fa-angle-up")})})});