/**
 * Created by ruggerotrevisiol on 14/02/17.
 */
import {MainScope} from  "../js-tools/MainScope";
import {GaranziaPrevTable} from "./GaranziaPrevTable";
import {DinamicField} from "./DinamicField";
import {FooterFlow} from "./FooterFlow";
import {Riepilogo} from "./Riepilogo";
export class Preventivo extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render() {
    var polizza = this.props.content;
    var prodottiHeader = [];
    var ig, ip, prodotti = [], garanzie = [], garanzieRow = [], parametri, totale;

    if (!polizza) {
      polizza = MainScope.getPolizza();
    }

    if (polizza) {
      prodotti = polizza.prodottoList;
      garanzie = polizza.garanzie;
      parametri = polizza.parametri;
      MainScope.setPolizza("prodottoList", polizza.prodottoList);
      MainScope.setPolizza("garanzie", polizza.garanzie);
      MainScope.setPolizza("parametri", polizza.parametri);
      MainScope.setPolizza("prodottoSelected", polizza.prodottoSelected);
      MainScope.setPolizza("prodottoAttivo", polizza.prodottoAttivo);
    }

    for (ig in garanzie) {
      garanzieRow.push(<GaranziaPrevTable key={"gar-" + ig} garanzia={garanzie[ig]} prodotti={prodotti}/>);
    }
    for (ip in prodotti) {
      prodottiHeader.push(<th key={"prodH-" + ip}>{prodotti[ip].nome}</th>);
    }
    if (prodottiHeader.length == 1) {
      prodottiHeader = [(<th key={"prodH-" + ip}>Massimali</th>)];
    }
    return (<div className="row preventivo">
    <div className="col-md-6 col-md-push-6">
      <Riepilogo/>
    </div>
    <div className="col-md-6 col-md-pull-6">
      <table className="tabellaPreventivo">
        <thead>
          {}
          <tr>
            <th></th>
            <th>{polizza.prodottoAttivo.nome}</th>
          </tr>
          <tr>
            <th></th>
            <th><hr /></th>
          </tr>
          {}
          <tr>
            <th>Garanzie</th>
            {prodottiHeader}
          </tr>
        </thead>
        <tbody>
          {garanzieRow}
        </tbody>
        <tfoot>
        </tfoot>
      </table>
    </div>
    <FooterFlow pagina={this.props.pagina} />
  </div>);
  }
}