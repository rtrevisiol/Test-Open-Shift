/**
 * Created by ruggerotrevisiol on 06/03/17.
 */
import {MainScope} from  "../js-tools/MainScope";
export class EditStep extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.naviga = this.naviga.bind(this);
  }
  naviga() {
    var step = this.props.step;
    MainScope.naviga({"idPagina": step});
  }
  render() {
    var testo = "Modifica";
    if (this.props.testo && this.props.testo.length > 0) {
      testo = this.props.testo;
    }
    return (
            <div className="editStep">
              <a href="javascript:void(0)" onClick={this.naviga}>{testo}</a>
            </div>
            );
  }
}