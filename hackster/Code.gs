let client_token;

function GetURL(URL) {
  return UrlFetchApp.fetch(encodeURI(URL), { 'method': 'get', muteHttpExceptions: true, headers: { 'Authorization': 'Bearer ' + client_token } }).getContentText();
}

function doGet(e) {

  let html = '<!DOCTYPE html><html><head><style>\
table { border-collapse: collapse; border-radius: 10px; outline: 1px solid gray; margin: 0px auto; text-align: center; width:90%}\
th, td { padding: 8px;}\
img { border-radius: 8px; height:90px;}\
tr:nth-child(even) { background-color: #2E9FE6;}\
</style></head><body>';

  client_token = JSON.parse(GetURL('https://www.hackster.io/users/api_token'))['client_token'];

  const user_name = e == null || e.parameter['user_name'] == null || e.parameter['user_name'] == '' ? 'abouhatab' : String(e.parameter['user_name']);

  const author_id = GetURL('https://www.hackster.io/' + user_name).split('entityId')[1].split('"')[1];
  if (isNaN(author_id)) author_id = '648001';

  const d = XmlService.parse(GetURL('https://www.hackster.io/' + user_name).split('<div class="">')[1].split('<div>')[0]).getRootElement().getChild('div').getChild('div');
  html += '<br><br><table style="width:0; white-space:nowrap; background-color:#2E9FE6;"><tr><td>';
  html += '<a href="' + d.getChild('img').getAttribute('src').getValue() + '" target="_blank"><img src="' + d.getChild('img').getAttribute('src').getValue() + '"></a>';
  html += '</td><td>';
  html += d.getChild('div').getChild('h1').getText();
  html += '</td><td>';
  html += d.getChild('div').getChild('div').getChildren('a')[0].getText();
  html += '</td><td>';
  html += '<form action="' + ScriptApp.getService().getUrl() + '" target="_top" method="get">';
  html += '<input type="text" id="user_name" name="user_name" value="' + user_name + '">';
  html += '<input type="submit" value="Submit"></form>';
  html += '</td></tr></table><br><hr style="width:90%;"><br>'

  let response = GetURL('https://api.hackster.io/graphql/query?json_data={"t":"projects_with_simple_pagination","variables":{"author_id":' + author_id + ',"guest_post":false,"publication_state":"PUBLIC","sort":"DATE_DESC","per_page":100}}');

  html += '<table>\
  <tr>\
    <th>Cover image</th>\
    <th>Project name <br> Elevator pitch</th>\
    <th>Schematics</th>\
    <th>Code</th>\
    <th>Respects <br> Views <br> Published</th>\
  </tr>';

  for (let f of JSON.parse(response)['projects']['records']) {
    html += '<tr><td><a href="' + f['cover_image_url'] + '" target="_blank"><img src="' + f['cover_image_url'] + '"></a>';
    html += '</td><td><a href="' + f['url'] + '" target="_blank">' + f['name'] + '</a><br>' + f['one_liner'];
    html += '</td><td>||1||';
    html += '</td><td>||2||';
    html += '</td><td>' + f['stats']['respects'] + ' <br> ' + f['stats']['views'] + '<br>||3||</td></tr>';
    response = GetURL(f['url']);
    try {
      const TempImage = response.split('<section id="schematics">')[1].split('<div class="embed')[1].split('src="')[1].split('"')[0];
      if (['apng', 'gif', 'ico', 'cur', 'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'apng', 'svg', 'avif', 'webp'].includes(TempImage.split('.').pop().toLowerCase())) html = html.replace('||1||', '<a href="' + TempImage + '?auto=compress%2Cformat" target="_blank"><img src="' + TempImage + '"></a>');
      else throw 0;
    }
    catch {
      html = html.replace('||1||', '');
    }
    try {
      let CodeURL = response.split('<section id="code">')[1].split('<div class="actions">')[1].split('href="')[1].split('"')[0];
      if (CodeURL == '#svg-clipboard') CodeURL = f['url'].replace('www.', '') + '#code';
      html = html.replace('||2||', '<a href="' + CodeURL + '" target="_blank">' + CodeURL.split('/')[2] + '</a>');
    }
    catch {
      html = html.replace('||2||', '');
    }
    try {
      html = html.replace('||3||', response.split('itemprop="datePublished">')[1].split('<')[0]);
    }
    catch {
      html = html.replace('||3||', '');
    }
  }
  html += '</table><br><br><br>';
  html += ' </body></html>';

  return HtmlService.createHtmlOutput(html);
};
