/**
 * Created by ruggerotrevisiol on 14/02/17.
 */

export class HeaderStep extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.attivaStep = this.attivaStep.bind(this);
    this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.state = {

    }
  }
  attivaStep(step) {
    var stepTotali = this.props.pagine.length, i, attiva = step;
    $(".headerStepCustom .allStep .step").each(function (index) {
      $(this).removeClass("active");
      $(this).removeClass("passed");
      var indice = index + 1, classe;
      if (indice == attiva) {
        classe = "active";
      } else if (indice > attiva) {
        classe = "";
      } else if (indice < attiva) {
        classe = "passed";
      }
      $(this).addClass(classe);
    });
  }
  shouldComponentUpdate(propCh, stateCh) {
    var self = this;
    self.attivaStep(propCh.active);
    var nomeActive = $("td.step.active > .labelStep").text();
    $("td.paginaAttivaResponsive").text(nomeActive);
    // return propCh.location.action === 'POP'; // hack bugFix
    return true;
  }
  componentDidMount() {
    var self = this;
    self.attivaStep(self.props.active);
    var nomeActive = $("td.step.active > .labelStep").text();
    $("td.paginaAttivaResponsive").text(nomeActive);
  }
  render() {
    var self = this;
    var voci = [];
    var i, link;
    for (i in this.props.pagine) {
      if (i > 0) {
        link = <div className="link"></div>
      }
      if (this.props.pagine[i].visible != false) {
        voci.push(<td className="step" key={i}>
          {link}
          <div className="numberStep">
            <span>
              {this.props.pagine[i].id}
            </span>
          </div>
          <div className="labelStep">{this.props.pagine[i].nome}</div>
        </td>);
      }
    }
    return <div className="headerStepCustom">
      <table className="allStep">
        <tbody>
          <tr>
            {voci}
          </tr>
          <tr><td className="paginaAttivaResponsive active" colSpan="6" style={{textAlign: "center"}}></td></tr>
        </tbody>
      </table>
    </div>
    }

  }
  ;