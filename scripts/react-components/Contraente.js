/**
 * Created by ruggerotrevisiol on 06/03/17.
 */
import {MainScope} from  "../js-tools/MainScope";
import {DinamicField} from "./DinamicField";
export class Contraente extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.componentDidMount = this.componentDidMount.bind(this);
    this.state = {
      contraenteLabels: MainScope.get("contraenteLabels"),
      campi: []
    }
  }
  componentDidMount() {

  }
  render() {
    //var polizza = MainScope.getPolizza(), contraente = polizza.contraente, i, contraenteRow = [], self = this;
    var self = this;
    var parametri = this.state.contraenteLabels, i, contraenteRow = [], self = this;
    if (parametri && parametri.fieldSet && parametri.fieldSet.length > 0) {
      for (i in parametri.fieldSet[0].campi) {
        var campo = parametri.fieldSet[0].campi[i];
        if (campo.visible) {
          campo.readonly = true;
          var campoHTML = (<span><span className="grassetto">{campo.label} : </span><DinamicField campo={campo}/></span>);
          contraenteRow.push(<div key={i}>{campoHTML}</div>);
        }
      }
    }
    return (
            <div>{contraenteRow}</div>
            );
  }
}
;