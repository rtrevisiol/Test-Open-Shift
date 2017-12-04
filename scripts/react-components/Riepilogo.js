/**
 * Created by ruggerotrevisiol on 01/03/17.
 */
import {DinamicField} from "./DinamicField";
import {MainScope} from  "../js-tools/MainScope";

export class Riepilogo extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {};
  }
  render() {
    var polizza = MainScope.getPolizza();
    var parametriRow = [], parametri = polizza.parametri, is, totale = polizza.prodottoAttivo.totale,
            totaleTasse = polizza.prodottoAttivo.tasse, totaleFixed, totaleTasseFixed;
    if (totale) {
      totaleFixed = totale.toFixed(2);
    }
    if (totaleTasse) {
      totaleTasseFixed = totaleTasse.toFixed(2);
    }
    for (is in parametri) {
      var parametro = parametri[is];
      parametro.father = "parametri";
      parametro.readonly = true;
      var html = (<div key={is} className="row">
        <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6 grassetto">
          {parametro.label} :
        </div>
        <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
          <DinamicField campo={parametro}/>
        </div>
      </div>);
      if (!parametro.visible) {
        html = "";
      }
      parametriRow.push(html);
    }
    return (
            <div className="dettaglio">
              <h1>Riepilogo Viaggio:</h1>
              {parametriRow}
              <div className="row grassetto">
                <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
                  Totale :
                </div>
                <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
                  {totaleFixed} &euro;
                </div>
                <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
                  Di cui imposte :
                </div>
                <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
                  {totaleTasseFixed} &euro;
                </div>
              </div>
              <div className="row grassetto">
                <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                  <a target="_blank" download={window.configApp.fascicoloUrl} href={window.configApp.fascicoloUrl}>Visualizza il fascicolo informativo</a>
                </div>
              </div>
            </div>);
  }
}