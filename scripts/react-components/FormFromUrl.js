/**
 * Created by ruggerotrevisiol on 14/02/17.
 */
import {MainScope} from  "../js-tools/MainScope";
import {DinamicField} from "./DinamicField";
import {Tooltip} from "./Tooltip";
import {FooterFlow} from "./FooterFlow";
import {ValidationServices} from "../js-tools/ValidationService";
export class FormFromUrl extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.componentDidMount = this.componentDidMount.bind(this);
    this.setField = this.setField.bind(this);
    this.state = {
      "campi": MainScope.getPolizza("parametri"),
      "contraente": {},
      "oggettiAssicurati": [],
      "prodotto": undefined
    }
  }
  componentDidMount() {
    var self = this;
    if (!(self.state.campi.length > 0)) {
      $.ajax({
        url: this.props.url,
        dataType: "json",
        method: "GET",
        success: function (campi) {
          var state = self.state;
          state.campi = campi;
          MainScope.setPolizza("parametri", campi);
          self.setState(state);
        },
        error: function (error) {
          console.error("Errori nella chiamata di composizione del form:", error);
        }
      });
    } else {
    }
    var pagina = this.props.pagina;
  }
  setField(campo) {
    var self = this;
    var state = this.state;
    var campi = this.state.campi, i;
    for (i in campi) {
      if (campi[i].name == campo.name) {
        campo.readonly = false;
        campi[i] = campo;
        state.campi = campi;
        self.setState(state);
      }
    }
    MainScope.setPolizza("parametri", campi);
  }
  render() {
    var self = this;
    var pagina = this.props.pagina;
    var campi = this.state.campi;
    var fields = [], i, conto = 0;
    /* *
     var campo1 = {
     "type": "comboBoxCustom",
     "comboBox": "province",
     "name": "provincia",
     "label": "Provincia",
     "readonly": true,
     "required": true,
     "visible": true,
     "anagrafica": true,
     "columns": 3,
     "values": "",
     "value": 8104
     };
     /* */
    for (i in campi) {
      var campo = campi[i];
      /* */
      if (campi[i].visible) {
        campo.readonly = false;
        conto++;
        /* */
        campo.father = "parametri";
        fields.push(<div key={i} className="row control-group">
          <div className="col-xs-2 col-sm-2 col-md-2 col-lg-2">
            <Tooltip campo={campi[i]}/>
            <label
              htmlFor={campi[i].name}>{conto + ". " + campi[i].label}</label>
          </div>
          <div className="col-xs-10 col-sm-10 col-md-10 col-lg-10">
            <DinamicField key={"campo_" + i} campo={campi[i]}/>
          </div>
        </div>);
      } else {
        fields.push(<DinamicField key={"campo_" + i} campo={campi[i]}/>);
      }
    }
    /* inizio TODO: da togliere!!! *
     fields.push(<div className="row control-group">
     <div className="col-xs-2 col-sm-2 col-md-2 col-lg-2">
     <Tooltip campo={campo1}/>
     <label htmlFor={campo1.name}>{"^_^ . " + campo1.label}</label>
     </div>
     <div className="col-xs-10 col-sm-10 col-md-10 col-lg-10">
     <DinamicField key={"campo_" + 292374} campo={campo1}/>
     </div>
     </div>);
     /* fine TODO: da togliere!!!  */
    return (<form name={pagina.submitForm}
          className={"form-inline " + pagina.submitForm + " col-xs-12 col-sm-12 col-md-12 col-lg-12"}>{fields}
      <FooterFlow pagina={pagina}/>
    </form>);
  }
}
;