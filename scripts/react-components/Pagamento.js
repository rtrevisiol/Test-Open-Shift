/**
 * Created by ruggerotrevisiol on 07/03/17.
 */
import {Loader} from "./Loader";
export class Pagamento extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.chiudiLoader = this.chiudiLoader.bind(this);
    // this.onBlur = this.onBlur.bind(this);
    // this.updateField = this.updateField.bind(this);
    // this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    // this.trovaPagina = this.trovaPagina.bind(this);
    // this.state = {};
  }
  componentDidMount() {
    var url = window.configApp.paymentProviderUrl;
    var method = "POST";
    //if (location.hostname === "localhost") {
      // method = "GET";
      document.getElementById('iframePagamento').contentWindow.location.href = url;
    /*} else {
      $.ajax({
        url: url,
        method: method,
        dataType: "json",
        success: function (data) {
          var url = data.urlPagamento + '%26p_auth%3D' + Liferay.authToken;
          console.log("url per l'iframe:", url)
          document.getElementById('iframePagamento').contentWindow.location.href = url;

          $(".myLoader").show();
        },
        error: function (error) {
          console.error("errori nel reperimento della url:", error);
        }
      });
    }*/

  }
  chiudiLoader() {
    $(".myLoader").hide();
  }
  render() {
    var testo = "caricamento in corso";
    var tipo = "loader";
    return (
            <div className="iframeContainer">
              <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
              </div>
              <div className="overlayIframe">
                <div className="headOverlay">
                  <h4>Limitazione di pagamento</h4>
                  <p>Sono accettate solo le carte intestate a persone fisiche; non è possibile pagare la polizza con una carta di credito intestata a persona giuridica seppure personalizzata.</p>
                </div>
                <div className="bodyOverlay" style={{'overflow': 'auto', 'WebkitOverflowScrolling': 'touch'}}>
                  <iframe name="iframePagamento" id="iframePagamento" src="" className="iframePagamento" onLoad={this.chiudiLoader} scrolling="yes" style={{"position": "absolute"}}/>
                  <Loader type={tipo} testo={testo}/>
                </div>
              </div>
            </div>);
              }
            }