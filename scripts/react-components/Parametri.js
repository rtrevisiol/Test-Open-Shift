/**
 * Created by ruggerotrevisiol on 06/03/17.
 */
import {MainScope} from  "../js-tools/MainScope";
import {DinamicField} from "./DinamicField";
export class Parametri extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render() {
    var polizza = MainScope.getPolizza(), parametri = polizza.parametri, i, parametriRow = [];
    for (i in parametri) {
      var parametro = parametri[i];
      parametro.father = "parametri";
      parametro.readonly = true;
      if (parametro.visible) {
        parametriRow.push(<div key={i}><span className="grassetto">{parametro.label} :</span> <DinamicField campo={parametro} /></div>);
      }
    }
    return (<div>{parametriRow}</div>);
  }
}
;