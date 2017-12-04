/**
 * Created by ruggerotrevisiol on 03/03/17.
 */
import {MainScope} from  "../js-tools/MainScope";
import {Riepilogo} from "./Riepilogo";
import {EditStep} from "./EditStep";
import {Parametri} from "./Parametri";
import {Contraente} from "./Contraente";
import {FooterFlow} from "./FooterFlow";
export class Sinottico extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {};
  }
  render() {
    var polizza = MainScope.getPolizza();
    var totale = polizza.prodottoAttivo.totale, totaleFixed;
    if (totale) {
      totaleFixed = totale.toFixed(2);
    }
    return (<div className="row">
      <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
        <p>
          Ti preghiamo di verificare le informazioni immesse prima di procedere al pagamento.
        </p>
      </div>
      <div className="row">
        <div className="col-xs-1 col-sm-1 col-md-1 col-lg-1">
          &nbsp;
        </div>
        <div className="col-xs-10 col-sm-10 col-md-10 col-lg-10 dettaglio">
          <div className="row">
            <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
              <div className="row">
                <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                  <h4>Informazioni di viaggio<EditStep step={1}/></h4>
                  <Parametri />
                  <span className="grassetto">Totale : {totaleFixed}</span>
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                  <h4>Prodotto scelto<EditStep testo="Visualizza" step={2}/></h4>
                  <span className="grassetto">{polizza.prodottoAttivo.nome}</span>
                  <p>{polizza.prodottoAttivo.descrizione}</p>
                </div>
              </div>
            </div>
            <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
              <div className="row">
                <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                  <h4>Contraente<EditStep step={3}/></h4>
                </div>
                <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                  <Contraente />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xs-1 col-sm-1 col-md-1 col-lg-1">
          &nbsp;
        </div>
      </div>
      <FooterFlow pagina={this.props.pagina}/>
    </div>);
  }
}