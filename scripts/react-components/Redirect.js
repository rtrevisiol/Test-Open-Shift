/**
 * Created by ruggerotrevisiol on 07/03/17.
 */
import {StringUtils} from "../js-tools/StringUtils";
export class Redirect extends React.Component {
  componentDidMount() {
    $(".headerStepCustom").parent().remove();
    $("#iframeOverlay").css("background-color", "white");
    $("#iframeOverlay").show();
  }
  redirect() {
    top.window.location.hash = '#/step/4';
  }
  render() {
    var self = this;
    var method = "POST";
    var esitoDEF = "KO";
    var esito = this.props.parametriUrl.esito, visibile = "";
    var codiceEsito = this.props.parametriUrl.codiceEsito;
    var messaggio = "Il pagamento non è andato a buon fine. La preghiamo di riprovare.";
    if (location.href.split("&esito=") && location.href.split("&esito=")[1]) {
      esitoDEF = location.href.split("&esito=")[1].split("&")[0];
    }
    //if (location.hostname === "localhost") {
      method = "GET";
      /* */
      if (esito == "true") {
        esitoDEF = "OK";
      } else {
        esitoDEF = "KO";
      }
      /* */
    //}
    if (esito == "true" && codiceEsito !== 0 && esitoDEF == "OK") {
      
      // top.window.location.hash = '#/step/6';
      /* */
      $.ajax({
        url: window.configApp["finalizzaPolizza"],
        method: method,
        success: function () {
          top.window.location.hash = '#/step/6';
        },
        error: function () {
          top.window.location.hash = '#/step/4';
        }
      });
      /* */
    } else {
      switch (codiceEsito) {
        case "122" :
          messaggio = "Il pagamento non è andato a buon fine. Il contratto non è stato emesso per raggiunto limite massimo di tentativi di pagamento. La preghiamo di procedere ad una nuova emissione.";
          break;
      }
    }
    if (esitoDEF !== "OK") {
      var html = (<div className="myOverlay" id="iframeOverlay">
        <div className="cont large row">
          <fieldset className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <h3>Esito del pagamento</h3>
            <div className="questionarioReact">
              <p>{messaggio}</p>
            </div>
            <div className="btn btn-primary right" onClick={this.redirect}>OK</div>
          </fieldset>
        </div>
      </div>);
    } else {
      var html = <span></span>;
    }
    return (<div>
      {html}
    </div>);
  }
}