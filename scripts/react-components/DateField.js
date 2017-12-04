import {MainScope} from  "../js-tools/MainScope";
import {Functions} from "../js-tools/Functions";
export class DateField extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.formatDate = this.formatDate.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.change = this.change.bind(this);
    this.state = {
      "campo": this.props.campo,
      "mobile": window.isMobile
    };
  }
  formatDate(sDate) {
    var newValue = "";
    var d = new Date(Number(sDate));
    if (d) {
      var month = '' + (d.getMonth() + 1),
              day = '' + d.getDate(),
              year = d.getFullYear();
      if (month.length < 2)
        month = '0' + month;
      if (day.length < 2)
        day = '0' + day;
      console.log("day", day, "month", month, "year", year);
      newValue = [day, month, year].join('/');
    }
    return newValue;
  }

  onBlur() {
    return this.change()
  }

  change() {
    var self = this;
    var campo = this.props.campo;
    var nodo = document.getElementById(campo.father + "-" + campo.name);
    var $el = $(nodo).closest(".form-group");
    var input = $el.find("input");
    var state = this.state;
    state.campo.value = input.val();
    var campo = state.campo;
    self.setState(state);
    $(nodo).trigger("change.dp");
    // MainScope.setField(campo);
    /* */
  }

  componentDidMount() {
    var self = this;
    var campo = this.props.campo;
    var state = this.state;
    var nodo = document.getElementById(campo.father + "-" + campo.name);
    $(nodo).on("setField", function () {
      return self.change()
    });
    var $el = $(nodo).closest(".form-group");
    $el.addClass("form-data");
    var input = $el.find("input");
    /* */
    // $("input").each(function () {
    // var input = $(this);
    /*
     if (input.hasClass("hasDatepicker")) {
     input.bootstrapDP("destroy");
     input.removeClass("hasDatepicker");
     input.removeAttr('id');
     input.attr("id", campo.father + "-" + campo.name);
     }
     */
    // });
    if ($.data(input.get(0), 'datepicker')) {
      input.bootstrapDP("remove");
    }
    /* */
    var config = this.props.campo.config;
    if (config) {
      var configuration = JSON.parse(config);
    }
    var optionsDate = {
      language: 'it',
      container: "#datepicker-" + campo.father + "-" + campo.name,
      format: 'dd/mm/yyyy',
      autoclose: true
    };

    if (configuration) {
      if (!campo.readonly) {
        var start = configuration.start;
        if (start) {
          optionsDate["startDate"] = start;
        }
        var end = configuration.end;
        if (end) {
          optionsDate["endDate"] = end;
        }
      }
      /*
       * 
       if (configuration.readonly) {
       state.campo.readonly = configuration.readonly;
       self.setState(state);
       }
       
       if(configuration.readonly){
       $( input ).prop( "disabled", true );
       }
       */
    }
    var cambioDataInCorso = function (evt) {
      var dateText = evt.target.value;
      var dateArray = dateText.split("/");
      var selectedDate = new Date(dateArray[2], dateArray[1] - 1, dateArray[0]);
      var now = new Date();
      now.setHours(0, 0, 0, 0);
      if (configuration) {
        if (configuration && configuration.functions && configuration.functions.length > 0) {
          configuration.functions.forEach(function (item, index, arr) {
            for (let i in item) {
              //select.on("change", function () {
              Functions[i](item[i]);
              //});
            }
          });
        }
        var maxDateField = campo.father + "-" + configuration.endField;
        var minDateField = campo.father + "-" + configuration.startField;
        var showTime = configuration.showTime;
//         var inputMaxDateField = $("#" + maxDateField + "").closest(".form-group").find("input");
//         if (inputMaxDateField.length > 0) {
//         inputMaxDateField.bootstrapDP("setStartDate", selectedDate);
//         }
        var inputMinDateField = $("#" + minDateField + "").closest(".form-group").find("input");
        if (inputMinDateField.length > 0) {
          inputMinDateField.bootstrapDP("setEndDate", selectedDate);
        }
      }
      if (showTime && (selectedDate.getTime() === now.getTime())) {
        now = new Date();
        var time = now.getHours() + ":" + now.getMinutes();
        $(input).after("<input type='text' readonly='true' class='data-ora' value='" + time + "' />");
      } else {
        $el.find(".data-ora").remove();
      }
      var campoModificato = campo;
      if (selectedDate && selectedDate.getTime()) {
        console.log("selectedDate.getTime()", selectedDate.getTime());
        console.log("campo.value", campo.value);
        campoModificato.value = selectedDate.getTime();
      }
      if (!self.props.readonly) {
        $(input).valid();
      } else {
        $("#datepicker-" + campo.father + "-" + campo.name).hide();
      }
      self.setState({"campo": campoModificato});
      MainScope.setField(campoModificato);
    };
    input.on("keydown", cambioDataInCorso);
    input.bootstrapDP(optionsDate).on("changeDate", cambioDataInCorso);
    /*    */
    if (campo.value) {
      input.bootstrapDP("setDate", new Date(parseInt(campo.value)));
    }

    var campoModificato = campo;
    if (input.bootstrapDP("getDate")) {
      campoModificato.value = input.bootstrapDP("getDate").getTime();
    }
    self.setState({"campo": campoModificato});
    MainScope.setField(campoModificato);

    /* INIZIO MOBILE HACK */
    if (this.state.mobile) {
      input.on("touchstart", function (e) {
        e.preventDefault();
        input.bootstrapDP("show");
        input.blur();
      });
    }
    /* FINE MOBILE HACK */
    return true;
  }
  render() {
    var self = this;
    var campo = this.props.campo;
    var style = {};
    if (this.props.readonly) {
      style.background = "none";
      style.border = "0 none transparent";
      style.margin = "0px";
      style.height = "inherit";
      style.lineHeight = "inherit";
      style.padding = "0px";
      style.WebkitBoxShadow = "none";
      style.MozBoxShadow = "none";
      style.boxShadow = "none";
    }
    return (<span>
      <div className="my-datepicker-container" id={"datepicker-" + campo.father + "-" + campo.name}></div>
      <input style={style} readOnly={this.props.readonly} disabled={this.props.readonly} type="text" id={campo.father + "-" + campo.name} className="form-control" name={campo.name} placeholder={campo.label}/>
    </span>);
  }
}
;
