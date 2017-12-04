/**
 * Created by ruggerotrevisiol on 01/12/16.
 */
window.bigFather = $("#contentReact")[0];
const React = require('react');
import {App} from "./react-components/App";
const detectmob = function () {
  console.log("window.innerWidth", window.innerWidth);
  console.log("window.innerHeight", window.innerHeight);
  if ((window.innerWidth <= 1024 && window.innerHeight <= 640) || (navigator.userAgent.indexOf("iPad") > -1)) {
    return true;
  } else {
    return false;
  }
}
window.isMobile = detectmob();
console.log("window.isMobile", window.isMobile);
$(document).ready(function () {
  if (window.isMobile) {
    $("#navbar-collapse-grid").addClass("collapse");
	  $(".logo.default-logo").hide();
  }
  var datepicker = $.fn.datepicker.noConflict(); // return $.fn.datepicker to previously assigned value
  $.fn.bootstrapDP = datepicker;                 // give $().bootstrapDP the bootstrap-datepicker functionality
  if (window.configApp && window.configApp.configURL) {
    $(".myLoader").show();
    $.ajax({
      url: window.configApp.configURL,
      dataType: "json",
      async: true,
      cache: false,
      method: "GET",
    }).then(function (data) {
      $(".myLoader").hide();
      ReactDOM.render(<App classContainer={data.classContainer}
           pagine={data.pagine}/>, bigFather);
      /*
       $("a").on("click", function () {
       if ($(this).attr("href").indexOf("void(0)") == -1) {
       return confirm('Uscendo perderai i dati del tuo viaggio.\n Vuoi continuare?');
       } else {
       return true;
       }
       });
       */
    }, function (error) {
      $(".myLoader").hide();
      console.error("error", error)
    });
  }
});