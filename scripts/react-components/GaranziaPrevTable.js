/**
 * Created by ruggerotrevisiol on 15/02/17.
 */
import {Tooltip} from "./Tooltip";
export class GaranziaPrevTable extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render() {
    var prodotti = this.props.prodotti, garanzia = this.props.garanzia, prodottiTd = [], i;
    /*
     function isPresent(element) {
     return element == 15;
     }
     [12, 5, 8, 130, 44].find(isBigEnough); // 130
     */
    var checkGar = function (garanzie) {
      var i, idGar = garanzia.id;
      var text = "-";
      for (i in garanzie) {
        if (garanzie[i].idGaranzia == idGar) {
          text = garanzie[i].massimaleSelected.valoreMassimale;
        }
      }
      if (text == "-" || text == "No") {
        text = (<div className="glyphicon glyphicon-remove"></div>);
      }
      if (text == "Si") {
        text = (<div className="glyphicon glyphicon-ok"></div>);
      }
      return text;
    };
    for (i in prodotti) {
      var textGar = checkGar(prodotti[i].garanzie);
      prodottiTd.push(<td key={"prod-" + i}>{textGar}</td>);
    }
    return (<tr className="rowGar">
    <td className="tdGar">{garanzia.nome} <Tooltip tooltip={{"title": garanzia.nome, "content": garanzia.descrizione}}/></td>
  {prodottiTd}
  </tr>);
    }
  }