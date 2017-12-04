/**
 * Created by ruggerotrevisiol on 14/02/17.
 */
import {TextField} from './TextField';
import {LookupField} from "./LookupField";
import {LookupOBJField} from "./LookupOBJField";
import {NumberField} from "./NumberField";
import {MultiField} from "./MultiField";
import {DateField} from "./DateField";
import {ComboboxField} from "./ComboboxField";
import {ComboBoxCustomField} from "./ComboBoxCustomField";
import {Consenso} from "./Consenso";


import {CurrencyField} from "./CurrencyField";
import {CheckboxField} from "./CheckboxField";
import {ValidationServices} from "../js-tools/ValidationService";
import {MainScope} from  "../js-tools/MainScope";

export class DinamicField extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    // this.onBlur = this.onBlur.bind(this);
    // this.updateField = this.updateField.bind(this);
    // this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    // this.trovaPagina = this.trovaPagina.bind(this);
    this.state = {
      campo: this.props.campo
    };
  }
  shouldComponentUpdate() {
    var self = this;
    var pagina = this.props.pagina;

    return true;
  }
  componentDidMount() {
    var pagina = MainScope.get("currentPage");
    var campo = this.state.campo;
    var nodo = document.getElementById(campo.father + "-" + campo.name);
    var nodoCampo = $(nodo).closest(".control-group");
    var input = $(document.getElementById(campo.father + "-" + campo.name));
    if (nodoCampo.length == 0) {
      nodoCampo = $(nodo).closest(".form-group");
    }
    var readonly = campo.readonly;
    if (pagina) {
      campo.submitForm = pagina.submitForm;
    }

    if (readonly) {
      input.css("background", "none");
    }
    if (campo.toValidate) {
      var validationOBJ = ValidationServices.creaRegola(campo);
    }
  }
  render() {
    var self = this;
    var campo = this.props.campo, htmlField = <div></div>;
    var tipo;
    if (campo) {
      if (campo.value == null) {
        campo.value = "";
      }
      htmlField = <TextField campo={campo}/>;
    }
    var readonly = campo.readonly, tooltip = "", position = "inherit", disabled = "", readonlyComp = false;
    if (campo.config) {
      var configuration = JSON.parse(campo.config);
      if (configuration.readonly) {
        readonlyComp = true;
        readonly = true;
        /*
         var nodo = document.getElementById(campo.father + "-" + campo.name);
         var $el = $(nodo).closest(".form-group");
         $el.addClass("form-data");
         var input = $el.find("input");
         input.prop('disabled', true);
         */
      }
    }
    if (readonly) {
      position = "relative";
      // disabled = <div className='disableField'></div>;
      tipo = "label";
      campo.toValidate = false;
      var valoreView = campo.value;
      htmlField = <span>{valoreView}<input name={campo.name} value={campo.value} id={campo.father + "-" + campo.name} type="hidden"/></span>;
      switch (campo.type) {
        case "date":
          campo.readonly = true;
          htmlField = <DateField campo={campo} readonly={true}/>;
          /*
           var data = new Date(parseInt(valoreView));
           var mese = (data.getMonth() + 1);
           var giorno = data.getDate();
           var format = function (number) {
           return ((number < 10) ? '0' + number : number)
           }
           valoreView = format(giorno) + "/" + format(mese) + "/" + data.getFullYear();
           htmlField = <span>{campo.value}<input readOnly="true" type="text" name={campo.name} id={campo.father + "-" + campo.name} /></span>;
           */
          break;
        case "lookup":
          if (campo.anagraficaValues && campo.anagraficaValues.length > 0) {
            valoreView = campo.anagraficaValues[0].val;
            htmlField = <span>{valoreView}</span>;
          }
          break;
        case "lookupobj":
          if (campo.anagraficaValues && campo.anagraficaValues.length > 0) {
            valoreView = campo.anagraficaValues[0].val;
            htmlField = <span>{valoreView}</span>;
          }
          break;
        case "comboBox":
          htmlField = <ComboboxField readonly={true} campo={campo}/>;
          // htmlField = <ComboLabel campo={campo}/>;
          break;
        case "comboBoxCustom":
          htmlField = <ComboBoxCustomField readonly={true} campo={campo}/>;
          // htmlField = <ComboLabel campo={campo}/>;
          break;
      }
    } else {
      campo.toValidate = true;
      switch (campo.type) {
        case "consenso":
          // campo.toValidate = false;
          htmlField = <Consenso campo={campo}/>;
          break;
        case "lookup":
          htmlField = <LookupField campo={campo}/>;
          break;
        case "lookupobj":
          htmlField = <LookupOBJField campo={campo}/>;
          break;
        case "date":
          htmlField = <DateField campo={campo} readonly={readonlyComp}/>;
          break;
        case "text":
          htmlField = <TextField campo={campo}/>;
          break;
        case "number":
          htmlField = <NumberField campo={campo}/>;
          break;
        case "multifield":
          htmlField = <MultiField campo={campo} tipo={tipo}/>;
          break;
        case "currency":
          htmlField = <CurrencyField campo={campo}/>;
          break;
        case "comboBox":
          htmlField = <ComboboxField campo={campo}/>;
          break;
        case "comboBoxCustom":
          htmlField = <ComboBoxCustomField campo={campo}/>;
          break;
        case "checkbox":
          htmlField = <CheckboxField campo={campo}/>;
          break;
      }
    }

    var classeCampo = "";
    if (campo.visible) {
      classeCampo = "";
    } else {
      classeCampo = "hidden";
    }
    var stile = {position: position};
    return (<div style={stile} className={"form-group " + classeCampo}>
      {disabled}
      {htmlField}
    </div>);
  }
}
;