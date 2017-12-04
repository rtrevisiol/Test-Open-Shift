/**
 * Created by ruggerotrevisiol on 01/03/17.
 */
import {Tooltip} from "./Tooltip";
import {DinamicField} from "./DinamicField";
export class DinamicFieldSet extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {};
  }
  componentDidMount() {
  }
  render() {
    var self = this, nascondi = "";
    var campi = this.props.campi;
    var fields = [], i;
    for (i in campi) {
      var campo = campi[i];
      var columns = 6, label = "";
      if (campo) {
        if ((campo.readonly == undefined)) {
          campo.readonly = false;
          campo.fieldSet = this.props.fieldSet;
        } else if (campo.readonly == true) {
          label = <b>{campo.label}</b>;
        }
        // campo.readonly = false;
        if (this.props.father) {
          campo.father = this.props.father;
        }
        if (campo.columns > 0) {
          columns = campo.columns;
        }
        if (campo.visible == false) {
          nascondi = "hidden";
        } else {
          nascondi = "";
        }
        fields.push(<div key={i}
             className={"control-group col-xs-12 col-sm-12 col-md-" + columns + " col-lg-" + columns + " larger " + nascondi}>
          {label}
          <DinamicField key={i} campo={campo}/>
        </div>);
      }
    }
    return (
            <div className="row">
              {fields}
            </div>
            );
  }
}
;