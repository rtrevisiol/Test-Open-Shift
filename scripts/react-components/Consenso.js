/**
 * Created by ruggerotrevisiol on 02/03/17.
 */
import {CheckboxField} from "./CheckboxField";
import {MainScope} from  "../js-tools/MainScope";
export class Consenso extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    // this.onBlur = this.onBlur.bind(this);
    // this.updateField = this.updateField.bind(this);
    // this.componentDidMount = this.componentDidMount.bind(this);
    this.state = {campo: this.props.campo};
  }
  render() {
    var self = this;
    var campo = this.props.campo;
    var link = "";
    if (campo.link) {
      var testoLink = campo.testoLink;
      if (!testoLink) {
        testoLink = campo.link;
      }
      link = (<a className="linkConsensi" target="blank" download={campo.link} href={campo.link}>{testoLink}</a>);
    }
    var istituto = campo.istituto;
    if (istituto === document.getElementById("istituto-template-source").value || !istituto) {
      return (<span>
        <span>{campo.label}</span>    
        {link}
        &nbsp;<CheckboxField campo={campo}/>
      </span>);
    } else {
      return(<span></span>);
    }
  }
}