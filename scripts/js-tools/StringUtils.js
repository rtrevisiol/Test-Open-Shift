class StringUtilsC {
  constructor(props) {
    this.props = props;
    this.getParams = this.getParams.bind(this);
  }
  getParams(url, param) {
    var vars = {};
    var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
      vars[key] = value;
    });
    if (param) {
      return vars[param];
    } else {
      return vars;
    }
  }
}
export const StringUtils = new StringUtilsC;