/**
 * Created by ruggerotrevisiol on 01/03/17.
 */
import {DinamicFieldSet} from "./DinamicFieldSet";
import {ValidationServices} from "../js-tools/ValidationService";

export class FormDati extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render() {
    var fieldSet = this.props.campi, i, html = [], consensi = this.props.consensi;
    for (i in fieldSet) {
      var gruppo = fieldSet[i];
      html.push(<fieldset key={"campi-" + i}>
        <legend>{gruppo.name}</legend>
        <DinamicFieldSet father={this.props.father} campi={gruppo.campi}/>
      </fieldset>)
    }
    if (consensi) {
      var campi = consensi.campi;
      html.push(<fieldset key={"consensi-" + i} className="consensiFieldSet">
        <legend>{consensi.name}</legend>
        <DinamicFieldSet  father={this.props.father} campi={campi}/>
      </fieldset>)
    }
    return (
            <div>
              {html}
            </div>
            );
  }
}
;