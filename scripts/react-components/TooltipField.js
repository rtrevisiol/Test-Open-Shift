/**
 * Created by ruggerotrevisiol on 01/02/17.
 */
export class TooltipField extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.componentDidMount = this.componentDidMount.bind(this);
  }
  componentDidMount() {
    var campo = this.props.campo;
    var $el = $("#tooltip_" + campo.name);
    if (campo && campo.config) {
      var config = campo.config;
      var configuration = JSON.parse(campo.config);
      var label = campo.label;
      var tooltip = configuration.tooltip;
      if (typeof (tooltip) == "string" && tooltip.length > 0) {
        var tooltipContent = $('<p style="text-align:left;"><strong>' + label + '</strong>' + tooltip + '</p>');
      }
      $el.tooltipster({
        content: tooltipContent
      });
    }
  }
  render() {
    var self = this;
    var campo = this.props.campo;
    var config = campo.config;
    var html = (<span>&nbsp;</span>);
    if (config) {
      var configuration = JSON.parse(config);
      var tooltip = configuration.tooltip;
      if (typeof (tooltip) == "string" && tooltip.length > 0) {
        html = (<div id={"tooltip_" + campo.name} className="tooltipCustom">?</div>);
      }
    }
    return (html);
  }
}