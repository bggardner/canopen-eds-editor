class CanOpen {

  static get ACCESS_TYPES() {
    return [
      'const',
      'ro',
      'rw',
      'wo'
    ];
  }

  static get COMPLEX_DATA_TYPES() {
    return {
      0x0020: 'PDO_COMMUNICATION_PARAMETER',
      0x0021: 'PDO_MAPPING',
      0x0022: 'SDO_PARAMETER',
      0x0023: 'IDENTITY'
    };
  }

  static get DATA_TYPES() {
    return {
      ...this.STANDARD_DATA_TYPES,
      ...this.COMPLEX_DATA_TYPES
    };
  }

  static get OBJECT_TYPES() {
    return {
      0x00: 'NULL',
      0x02: 'DOMAIN',
      0x05: 'DEFTYPE',
      0x06: 'DEFSTRUCT',
      0x07: 'VAR',
      0x08: 'ARRAY',
      0x09: 'RECORD'
    };
  }

  static get PDO_MAPPING_OPTIONS() {
    return {
      '0': 'no',
      '1': 'yes'
    };
  }

  static get STANDARD_DATA_TYPES() {
    return {
      0x0001: 'BOOLEAN',
      0x0002: 'INTEGER8',
      0x0003: 'INTEGER16',
      0x0004: 'INTEGER32',
      0x0005: 'UNSIGNED8',
      0x0006: 'UNSIGNED16',
      0x0007: 'UNSIGNED32',
      0x0008: 'REAL32',
      0x0009: 'VISIBLE_STRING',
      0x000A: 'OCTET_STRING',
      0x000B: 'UNICODE_STRING',
      0x000C: 'TIME_OF_DAY',
      0x000D: 'TIME_DIFFERENCE',
      0x000F: 'DOMAIN'
    };
  }
}

function addEventListeners(element) {
  element.querySelectorAll('tr:nth-child(2) td:nth-child(9) input').forEach(element => {
    element.addEventListener('change', event => {
      const n = parseInt(element.value, 0);
      if (isNaN(n)) {
        alert(`Invalid integer: ${element.value}`);
        element.value = element.defaultValue;
        return;
      }
      element.defaultValue = element.value;
      const object = element.closest('[data-mi]');
      const last = parseInt(object.querySelector('[data-si]:last-child').dataset.si, 16);
      if (n == last) {
        return;
      }
      object.querySelector('tr:first-child td:first-child').rowSpan = n + 2;
      if (n > last) {
        for (i = last + 1; i <= n; i++) {
          const si = i.toString(16).toUpperCase(); // Hex w/o leading zero
          html = `<tr data-si="${si}">
  <td>${si.padStart(2, '0')}<sub>h</sub></td>
  <td>
    <input type="text" maxlength="241">
  </td>
  <td></td>
  <td>VAR</td>
  <td>
    <select>`;
          Object.entries(CanOpen.STANDARD_DATA_TYPES).forEach(element => {
            [value, name] = element;
            html += `
      <option value="${value}">${name}</option>`;
          });
          html += `
    </select>
  </td>
  <td>
    <select>
      <option>const</option>
      <option>ro</option>
      <option>rw</option>
      <option>wo</option>
    </select>
  </td>
  <td>
    <input type="text" maxlength="244">
  </td>
  <td>
    <input type="text" maxlength="243">
  </td>
  <td>
    <input type="text" maxlength="242">
  </td>
  <td>
    <select>
      <option>no</option>
      <option>yes</option>
    </select>
  </td>
  <td>
    <button type="button" class="btn" data-role="remove">&#10006;</button>
  </td>
</tr>`;
          object.insertAdjacentHTML('beforeend', html);
          addEventListeners(object.lastElementChild);
        }
      } else {
        object.querySelectorAll(`[data-si="${n.toString(16)}"]~[data-si]`).forEach(element => element.remove());
      }
    });
  });

  element.querySelectorAll('[data-role="remove"]').forEach(element => {
    element.addEventListener('click', event => {
      const subIndex = element.closest('[data-si]');
      if (subIndex) {
        element.closest('[data-mi]').querySelector('td:first-child').rowSpan -= 1;
        subIndex.remove();
      } else {
        element.closest('[data-mi]').remove();
      }
    });
  });

  element.querySelectorAll('[id^="cso"]').forEach(element => {
    element.addEventListener('change', event => {
      const tbody = element.closest('tbody');
      const parameterName = tbody.querySelector('tr:nth-child(2) td:nth-child(2) input');
      const accessType = tbody.querySelector('tr:nth-child(2) td:nth-child(6) select');
      const pdoMapping = tbody.querySelector('tr:nth-child(2) td:nth-child(10) select');
      if (event.target.checked) {
        tbody.classList.add('cso');
        parameterName.value = 'NrOfObjects';
        parameterName.disabled = true;
        Array.from(accessType.options).forEach(element => {
          element.selected = element.value == 'ro';
        });
        accessType.disabled = true;
        Array.from(pdoMapping.options).forEach(element => {
          element.selected = element.value == 'no';
        });
        pdoMapping.disabled = true;
        tbody.querySelectorAll('tr:nth-child(n+3) td:nth-child(2) input').forEach(element => {
          if (element.value == '') {
            element.closest('tr').remove();
            tbody.querySelector('tr:first-child td:first-child').rowSpan -= 1;
          }
        });
      } else {
        tbody.classList.remove('cso');
        parameterName.disabled = false;
        parameterName.value = 'Highest sub-index supported';
        accessType.disabled = false;
        pdoMapping.disabled = false;
      }
    });
  });
}

function loadObject(parser, sectionName, kind) {
  if (document.querySelector(`[data-mi="${sectionName}"]`)) {
    throw `Index 0x${sectionName} already exists`;
  }
  const optionsList = parser.options(sectionName);
  const compactSubObj = parseInt(parser.get(sectionName, 'CompactSubObj', 0), 0);
  let subNumber = parseInt(parser.get(sectionName, 'SubNumber', 0), 0);
  if (compactSubObj && subNumber) {
    throw 'CompactSubObj and SubNumber cannot both be non-zero';
  }
  compactSubObjectNames = {};
  if (compactSubObj) {
    if (parser.isHaveSection(`${sectionName}Name`)) {
      for (let i = 1; i <= compactSubObj; i++) {
        const name = parser.get(`${sectionName}Name`, i, '');
        if (name == '') {
          continue;
        }
        compactSubObjectNames[i] = name;
        if (Object.keys(compactSubObjectNames).length == compactSubObj) {
          break;
        }
      }
    }
  }
  const objectType = parseInt(parser.get(sectionName, 'ObjectType', '0x7'), 0);
  if ([0x06, 0x08, 0x09].includes(objectType) && !subNumber && !compactSubObj) {
    throw 'Invalid complex object: no sub-indexes';
  }
  const rowSpan = subNumber ? ` rowspan="${subNumber + 1}"` : (compactSubObj ? ` rowspan="${Object.keys(compactSubObjectNames).length + 2}"` : '');
  let html = `<tbody data-mi="${sectionName}" data-oc="${objectType}"${compactSubObj ? ' class="cso"' : ''}>
  <tr>
    <td${rowSpan}>${sectionName}<sub>h</sub></td>
    <td></td>
    <td>
      <input type="text" maxlength="241" value="${parser.get(sectionName, 'ParameterName')}">
    </td>
    <td>
      <select>`;
  ['mandatory', 'optional'].forEach(element => {
    html += `
        <option${element == kind ? ' selected' : ''}>${element}</option>`;
  });
  html += `
      </select>
    </td>
    <td>${CanOpen.OBJECT_TYPES[objectType]}</td>
    <td>`;
  const dataType = parseInt(parser.get(sectionName, 'DataType', objectType == 0x2 ? 0x000F : 0), 0);
  if (objectType != 0x0) { // Not NULL
    html += `
      <select>`;
    let dataTypes;
    if (objectType == 0x05) { // DEFTYPE
      dataTypes = { 0x0007: 'UNSIGNED32' };
    } else if (objectType == 0x9) { // RECORD
      dataTypes = CanOpen.COMPLEX_DATA_TYPES;
    } else { // DOMAIN, DEFTYPE, VAR, ARRAY
      dataTypes = CanOpen.STANDARD_DATA_TYPES;
    }
    let dataTypeFound = false;
    Object.entries(dataTypes).forEach(element => {
      [value, name] = element;
      dataTypeFound = dataTypeFound || (value == dataType);
      html += `
        <option value="${value}"${value == dataType ? ' selected' : ''}>${name}</option>`;
    });
    if ([0x2, 0x5, 0x7].includes(objectType) && !dataTypeFound) { // Don't throw error if no DataType for RECORD
      throw `Unsupported data type 0x${dataType.toString(16).padStart(4, '0')} in [${sectionName}]`;
    }
    html += `
      </select>`;
  }
  html += `
    </td>
    <td>
      <select>`;
  const accessType = parser.get(sectionName, 'AccessType', objectType == 0x2 ? 'rw' : '');
  CanOpen.ACCESS_TYPES.forEach(element => {
    html += `
        <option${element == accessType ? ' selected' : ''}>${element}</option>`;
  });
  html += `
      </select>
    </td>
    <td`;
  if (objectType == 0x08) {
    html += ` colspan="2">
      <input id="cso${sectionName}" type="checkbox" ${compactSubObj ? ' checked' : ''}>
      <label for="cso${sectionName}">CompactSubObj</label>`;
  } else if ([0x02, 0x08, 0x09].includes(objectType)) {
    html += `>
    </td>
    <td>`;
  } else {
    html += `>
      <input type="text" value="${parser.get(sectionName, 'LowLimit', '')}" maxlength="244">
    </td>
    <td>
      <input type="text" value="${parser.get(sectionName, 'HighLimit', '')}" maxlength="243">`;
  }
  const defaultValue = parser.get(sectionName, 'DefaultValue', '');
  html += `
    </td>
    <td>
      <input type="text" value="${defaultValue}" maxlength="242">
    </td>
    <td>
      <select>`;
  const pdoMapping = parser.get(sectionName, 'PDOMapping', '0');
  Object.entries(CanOpen.PDO_MAPPING_OPTIONS).forEach(element => {
    [value, name] = element;
    html += `
        <option value="${value}" ${value == pdoMapping ? ' selected' : ''}>${name}</option>`;
  });
  html += `
      </select>
    </td>
    <td>`;
  const objectFlags = parseInt(parser.get(sectionName, 'ObjFlags', 0), 0);
  html += `
      <input type="checkbox" id="ofr${sectionName}"${objectFlags & 0x2 ? ' checked' : ''}>
      <label for="ofr${sectionName}" title="Read">R</label>
      <input type="checkbox" id="ofw${sectionName}"${objectFlags & 0x1 ? ' checked' : ''}>
      <label for="ofw${sectionName}" title="Write">W</label>
    </td>
    <td>
      <button type="button" class="btn" data-role="remove">&#10006;</button>
    </td>
  </tr>`;
  if (compactSubObj) {
    html += `
  <tr data-si="0">
    <td>00<sub>h</sub></td>
    <td><input type="text" value="NrOfObjects" disabled></td>
    <td></td>
    <td>VAR</td>
    <td>
      <select disabled>`;
    Object.entries(CanOpen.STANDARD_DATA_TYPES).forEach(element => {
      [value, name] = element;
      html += `
        <option value="${value}"${name == 'UNSIGNED8' ? ' selected' : ''}>${name}</option>`;
    });
    html += `
      </select>
    </td>
    <td>
      <select disabled>`;
    CanOpen.ACCESS_TYPES.forEach(element => {
      html += `
        <option${element == 'ro' ? ' selected' : ''}>${element}</option>`;
    });
    html += `
      </select>
    </td>
    <td>
      <input type="text" maxlength="244">
    </td>
    <td>
      <input type="text" maxlength="243">
    </td>
    <td>
      <input type="text" maxlength="241" value="${compactSubObj}">
    </td>
    <td>
      <select>`;
    Object.entries(CanOpen.PDO_MAPPING_OPTIONS).forEach(element => {
      [value, name] = element;
      html += `
        <option value="${value}" ${name == 'no' ? ' selected' : ''}>${name}</option>`;
    });
    html += `
    </td>
    <td></td>
    <td></td>
  </tr>`;
    for (i in compactSubObjectNames) {
      html += `
  <tr data-si="${i.toString(16)}">
    <td>${i.toString(16).padStart(2, '0')}<sub>h</sub></td>
    <td>
      <input type="text" maxlength="${255 - i.toString(16).length}" value="${compactSubObjectNames[i]}">
    </td>
    <td></td>
    <td>VAR</td>
    <td>
      <select>`;
      Object.entries(CanOpen.STANDARD_DATA_TYPES).forEach(element => {
        [value, name] = element;
        html += `
        <option value="${value}"${value == dataType ? ' selected' : ''}>${name}</option>`;
      });
      html += `
      </select>
    </td>
    <td>
      <select>`;
    CanOpen.ACCESS_TYPES.forEach(element => {
      html += `
        <option${element == accessType ? ' selected' : ''}>${element}</option>`;
    });
    html += `
      </select>
    </td>
    <td>
      <input type="text" maxlength="244">
    </td>
    <td>
      <input type="text" maxlength="243">
    </td>
    <td>
      <input type="text" maxlength="242" value="${defaultValue}">
    </td>
    <td>
      <select>`;
    Object.entries(CanOpen.PDO_MAPPING_OPTIONS).forEach(element => {
      [value, name] = element;
      html += `
        <option value="${value}" ${value == pdoMapping ? ' selected' : ''}>${name}</option>`;
    });
    html += `
      </select>
    </td>
    <td></td>
    <td>
      <button type="button" class="btn" data-role="remove">&#10006;</button>
    </td>
  </tr>`;
    }
  }
  if (subNumber) {
    for (let i = 0; i < subNumber; i++) {
      let subIndex = i.toString(16).toUpperCase(); // Hex w/o leading zeros
      let subSectionName = `${sectionName}sub${subIndex}`;
      if (!parser.isHaveSection(subSectionName)) {
        subIndex = i.toString(16).toLowerCase(); // ConfigIniParser is case-sensitive
        subSectionName = `${sectionName}sub${subIndex}`;
        if (!parser.isHaveSection(subSectionName)) {
          console.info(`Section [${subSectionName}] skipped`);
          continue;
        }
      }
      const subObjectType = parseInt(parser.get(subSectionName, 'ObjectType', '0x7'), 0);
      const subDataType = parseInt(parser.get(subSectionName, 'DataType', objectType == 0x08 ? dataType : 0), 0);
      const subAccessType = parser.get(subSectionName, 'AccessType', '');
      html += `
  <tr data-si="${subIndex}">
    <td>${subIndex.padStart(2, '0')}<sub>h</sub></td>
    <td>
      <input type="text" maxlength="241" value="${parser.get(subSectionName, 'ParameterName')}">
    </td>
    <td></td>
    <td>${CanOpen.OBJECT_TYPES[subObjectType]}</td>
    <td>`;
      if (subObjectType != 0x00) {
        html += `
      <select${i == 0 ? ' disabled' : ''}>`;
        Object.entries(CanOpen.STANDARD_DATA_TYPES).forEach(element => {
          [value, name] = element;
          html += `
        <option value="${value}"${value == subDataType ? ' selected' : ''}>${name}</option>`;
        });
        html += `
      </select>`;
      }
      html += `
    <td>
      <select>`;
        CanOpen.ACCESS_TYPES.forEach(element => {
          html += `
        <option${element == subAccessType ? ' selected' : ''}>${element}</option>`;
          });
      html += `
      </select>
    </td>
    <td>
      <input type="text" value="${parser.get(subSectionName, 'LowLimit', '')}" maxlength="244">
    </td>
    <td>
      <input type="text" value="${parser.get(subSectionName, 'HighLimit', '')}" maxlength="243">
    </td>
    <td>`;
      if (i == 0 && [0x08, 0x09].includes(objectType)) {
        const highestSubIndex = parseInt(parser.get(subSectionName, 'DefaultValue', 0), 0);
        if (subNumber == 1 && highestSubIndex != 0) {
          throw 'SubNumber is greater than highest sub-index';
        } else if (highestSubIndex > subNumber - 1) {
          console.info(`Complex object [${sectionName}] has non-sequential sub-indices`);
        }
        html += `
      <input type="text" value="${subNumber - 1}" maxlength="242">`;
      } else {
        html += `
      <input type="text" value="${parser.get(subSectionName, 'DefaultValue', '')}" maxlength="242">`;
      }
      html += `
    </td>
    <td>
      <select>`;
      const subPdoMapping = i == 0 ? '0' : parser.get(subSectionName, 'PDOMapping', '0');
      Object.entries(CanOpen.PDO_MAPPING_OPTIONS).forEach(element => {
        [value, name] = element;
        html += `
        <option value="${value}"${value == subPdoMapping ? ' selected' : ''}${i == 0 ? ' disabled' : ''}>${name}</option>`;
        });
      html += `
      </select>
    </td>
    <td></td>
    <td>
      ${i > 0 ? '<button type="button" class="btn" data-role="remove">&#10006;</button>' : ''}
    </td>
  </tr>`;
    }
  }
  html += `
</tbody>`;
  document.querySelector('fieldset:last-child tfoot').insertAdjacentHTML('beforebegin', html);
}

function saveObject(parser, mi) {
  const tbody = document.querySelector(`[data-mi="${mi}"]`);
  const objectType = parseInt(tbody.dataset.oc);
  parser.addSection(mi);
  const parameterName = tbody.querySelector('td:nth-child(3) input').value;
  if (parameterName.length < 1 || parameterName.length > 241) {
    throw `ParameterName for [${mi}] must be between 1 and 241 characters`;
  }
  parser.set(mi, 'ParameterName', parameterName);
  if (objectType != 0x7) { // Default ObjectType is VAR
    parser.set(mi, 'ObjectType', `0x${objectType}`);
  }
  let compactSubObj = 0;
  if (objectType == 0x8) {
    compactSubObj = tbody.querySelector('tr:first-child td:nth-child(8) input').checked ? parseInt(tbody.querySelector('tr:nth-child(2) td:nth-child(9) input').value) : 0;
  }
  if (compactSubObj) {
    parser.set(mi, 'CompactSubObj', compactSubObj);
  }
  if ([0x2, 0x5, 0x7, 0x9].includes(objectType) || compactSubObj) { // CiA306-1 Table 7: RECORD DataType is not supported (but why?)
    const dataType = parseInt(tbody.querySelector('td:nth-child(6) select').value);
    if (objectType != 0x02 || dataType != 0x000F) { // DOMAIN default DataType is DOMAIN
      parser.set(mi, 'DataType', `0x${dataType.toString(16).toUpperCase().padStart(4, '0')}`);
    }
  }
  if ([0x2, 0x5, 0x7].includes(objectType) || compactSubObj) {
    const accessType = tbody.querySelector('td:nth-child(7) select').value;
    if (objectType != 0x02 || accessType != 'rw') { // DOMAIN default AccessType is rw
      parser.set(mi, 'AccessType', accessType);
    }
    const defaultValue = tbody.querySelector(`td:nth-child(${compactSubObj ? 9 : 10}) input`).value;
    if (defaultValue) {
      parser.set(mi, 'DefaultValue', defaultValue); // Varies based on DataType
    }
  }
  if ([0x5, 0x7].includes(objectType) || compactSubObj) {
    const pdoMapping = tbody.querySelector(`td:nth-child(${compactSubObj ? 10 : 11}) select`).value;
    if (pdoMapping == '1') { // Default PDOMapping is 0
      parser.set(mi, 'PDOMapping', '1');
    }
  }
  if ([0x5, 0x7].includes(objectType)) {
    const lowLimit = tbody.querySelector('td:nth-child(8) input').value;
    if (lowLimit != '') {
      parser.set(mi, 'LowLimit', lowLimit);
    }
    const highLimit = tbody.querySelector('td:nth-child(9) input').value;
    if (highLimit != '') {
      parser.set(mi, 'HighLimit', highLimit);
    }
  }
  const objectFlags = (tbody.querySelector(`#ofr${mi}`).checked ? 2 : 0) + (tbody.querySelector(`#ofw${mi}`).checked ? 1 : 0);
  if (objectFlags) {
    parser.set(mi, 'ObjFlags', objectFlags);
  }
  if (compactSubObj) {
    const names = {};
    tbody.querySelectorAll('tr:nth-child(n+3)[data-si]').forEach(element => {
      const name = element.querySelector('td:nth-child(2) input');
      const si = parseInt(element.dataset.si, 16);
      if (name.value != '' && name.value != `${parameterName}${si}`) {
        names[si] = name.value;
      }
    });
    if (Object.keys(names).length) {
      parser.addSection(`${mi}Name`);
      Object.entries(names).forEach(element => {
        [si, name] = element;
        parser.set(`${mi}Name`, si, name);
      });
    }
  } else if ([0x6, 0x8, 0x9].includes(objectType)) {
    const subs = tbody.querySelectorAll('[data-si]');
    parser.set(mi, 'SubNumber', subs.length);
    subs.forEach(element  => {
      const sectionName = `${mi}sub${element.dataset.si}`;
      parser.addSection(sectionName);
      parser.set(sectionName, 'ParameterName', element.querySelector('td:nth-child(2) input').value);
      // ObjectType is implied as VAR
      const dataType = parseInt(element.querySelector('td:nth-child(5) select').value);
      parser.set(sectionName, 'DataType', `0x${dataType.toString(16).padStart(4, '0')}`);
      const accessType = element.querySelector('td:nth-child(6) select').value;
      if (dataType != 0x000F || accessType != 'rw') { // DOMAIN default AccessType is rw
        parser.set(sectionName, 'AccessType', accessType);
      }
      let defaultValue = element.querySelector('td:nth-child(9) input').value;
      if (defaultValue != '') {
        if (element.dataset.si == '0') {
          defaultValue = `0x${parseInt(defaultValue, 0).toString(16).toUpperCase().padStart(2, '0')}`;
        }
        parser.set(sectionName, 'DefaultValue', defaultValue); // Varies based on DataType
      }
      const pdoMapping = element.querySelector('td:nth-child(10) select').value;
      if (pdoMapping == '1') { // Default PDOMapping is 0
        parser.set(sectionName, 'PDOMapping', '1');
      }
      const lowLimit = element.querySelector('td:nth-child(7) input').value;
      if (lowLimit != '') {
        parser.set(sectionName, 'LowLimit', lowLimit); // Varies based on DataType
      }
      const highLimit = element.querySelector('td:nth-child(8) input').value;
      if (highLimit != '') {
        parser.set(sectionName, 'HighLimit', highLimit); // Varies based on DataType
      }
    });
  }
}

function toDateTimeInput(ds, ts) {
  const dm = ds.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (!dm) {
    throw 'Invalid date format';
  }
  const d = `${dm[3]}-${dm[1]}-${dm[2]}`;
  if (isNaN(Date.parse(d))) {
    throw 'Invalid date: {$ds}';
  }
  const tm = ts.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/); // Generous, as format should by hh:mm(AM|PM)
  if (!tm) {
    throw `Invalid time format: ${ts}`;
  }
  const h = parseInt(tm[1]);
  const t = `${(tm[3] == 'PM' && h != 12 ? h + 12 : tm[1]).toString().padStart(2, '0')}:${tm[2]}`;
  const dt = `${d}T${t}`;
  if (isNaN(Date.parse(dt))) {
    throw `Invalid time: ${ts}`;
  }
  return dt;
}

function toDateEDS(s) {
  if (s == '') {
    throw 'Date/Time is required';
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) {
    throw 'Invalid datetime format';
  }
  return `${m[2]}-${m[3]}-${m[1]}`;
}

function toTimeEDS(s) {
  if (s == '') {
    throw 'Date/Time is required';
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) {
    throw 'Invalid datetime format';
  }
  let h = parseInt(m[4]);
  const ampm = h < 12 ? 'AM' : 'PM';
  h = (h > 12 ? h - 12 : h).toString().padStart(2, '0');
  return `${h}:${m[5]}${ampm}`;
}

document.addEventListener('DOMContentLoaded', event => {
  document.querySelector('input[type="file"]').addEventListener('change', event => {
    document.querySelectorAll('fieldset:last-child tbody').forEach(element => element.remove());
    const [file] = event.target.files;
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', event => {
        try {
          document.querySelector('input[type="file"]').value = ''; // Re-arm change event
          const parser = new ConfigIniParser();
          parser.parse(event.target.result);

          // File Info
          document.querySelector('#file_name').value = parser.get('FileInfo', 'FileName', '');
          document.querySelector('#file_version').value = parser.get('FileInfo', 'FileVersion', '');
          document.querySelector('#file_revision').value = parser.get('FileInfo', 'FileRevision', '');
          document.querySelector('#eds_version').value = parser.get('FileInfo', 'EDSVersion', '');
          document.querySelector('#description').value = parser.get('FileInfo', 'Description', '');
          document.querySelector('#creation_time').value = toDateTimeInput(
            parser.get('FileInfo', 'CreationDate', ''),
            parser.get('FileInfo', 'CreationTime', '')
          );
          document.querySelector('#creation_time').disabled = false;
          document.querySelector('#auto_creation_time').checked = false;
          document.querySelector('#created_by').value = parser.get('FileInfo', 'CreatedBy', '');
          document.querySelector('#modification_time').value = toDateTimeInput(
            parser.get('FileInfo', 'ModificationDate', ''),
            parser.get('FileInfo', 'ModificationTime', '')
          );
          document.querySelector('#modified_by').value = parser.get('FileInfo', 'ModifiedBy', '');
          document.querySelector('fieldset:first-child table').classList.add('show');

          // Device Info
          document.querySelector('#vendor_name').value = parser.get('DeviceInfo', 'VendorName', '');
          document.querySelector('#vendor_number').value = parseInt(parser.get('DeviceInfo', 'VendorNumber', ''), 0);
          document.querySelector('#product_name').value = parser.get('DeviceInfo', 'ProductName', '');
          document.querySelector('#product_number').value = parseInt(parser.get('DeviceInfo', 'ProductNumber', ''), 0);
          document.querySelector('#revision_number').value = parseInt(parser.get('DeviceInfo', 'RevisionNumber', ''), 0);
          document.querySelector('#order_code').value = parser.get('DeviceInfo', 'OrderCode', '');
          [10, 20, 50, 125, 250, 500, 800, 1000].forEach(baud => {
            document.querySelector(`#baud_rates option[value="${baud}"]`).selected = parser.get('DeviceInfo', `BaudRate_${baud}`, '0') == '1';
          });
          document.querySelector('#bootup_master').selected = parser.get('DeviceInfo', 'SimpleBootUpMaster', '0') == '1';
          document.querySelector('#bootup_slave').selected = parser.get('DeviceInfo', 'SimpleBootUpSlave', '0') == '1';
          document.querySelector('#granularity').value = parseInt(parser.get('DeviceInfo', 'Granularity', 8), 0);
          if (parseInt(parser.get('DeviceInfo', 'DynamicChannels', '0'), 0) != 0) {
            throw 'Dynamic channels are not supported';
          }
          if (parseInt(parser.get('DeviceInfo', 'CompactPDO', '0'), 0) != 0) {
            throw 'CompactPDOs are not supported';
          }
          document.querySelector('#rx_pdos').value = parser.get('DeviceInfo', 'NrOfRxPDO', '0');
          document.querySelector('#tx_pdos').value = parser.get('DeviceInfo', 'NrOfTxPDO', '0');
          document.querySelector('fieldset:nth-child(2) table').classList.add('show');

          // Other
          [1, 2, 3, 4, 5, 6, 7].forEach(dt => {
            document.querySelector(`#dummy_usage option[value="${dt}"]`).selected = parser.get('DummyUsage', `Dummy${dt.toString().padStart(4, '0')}`, '0') == '1';
          });
          document.querySelector('#comments').value = '';
          for (i = 1; i <= parseInt(parser.get('Comments', 'Lines', 0), 0); i++) {
            document.querySelector('#comments').value += `${parser.get('Comments', `Line${i}`, '')}\n`;
          }
          document.querySelector('fieldset:nth-child(3) table').classList.add('show');

          // Object Dictionary
          const nMandatoryObjects = parseInt(parser.get('MandatoryObjects', 'SupportedObjects', 0));
          const nOptionalObjects = parseInt(parser.get('OptionalObjects', 'SupportedObjects', 0));
          const nManufacturerObjects = parseInt(parser.get('ManufacturerObjects', 'SupportedObjects', 0));
          const nObjects = nMandatoryObjects + nOptionalObjects + nManufacturerObjects;
          ['Mandatory', 'Optional', 'Manufacturer'].forEach(element => {
            const nObjects = parser.get(`${element}Objects`, 'SupportedObjects', 0);
            for (let i = 1; i <= nObjects; i++) {
              let sectionName = parser.get(`${element}Objects`, i);
              // Do not parse as int, since ConfigIniParser is case-sensitive
              if (sectionName.startsWith('0x')) {
                sectionName = sectionName.substring(2);
              }
              loadObject(parser, sectionName, element == 'Manufacturer' ? '' : element.toLowerCase());
            }
          });
        } catch (error) {
          alert(error);
          throw error;
        }
        document.querySelector('fieldset:last-child table').classList.add('show');

        document.querySelectorAll('fieldset:last-child tbody').forEach(element => addEventListeners(element));
      });
      reader.readAsText(file);
    }
  });

  document.querySelector('form').addEventListener('submit', event => {
    return true;
    event.preventDefault();
    return false;
  });

  document.querySelectorAll('input+input[type="checkbox"]').forEach(element => {
    element.addEventListener('change', event => {
      if (element.checked) {
        element.previousElementSibling.disabled = true;
        element.previousElementSibling.required = false;
      } else {
        element.previousElementSibling.disabled = false;
        element.previousElementSibling.required = true;
      }
    });
  });

  document.querySelector('tfoot td:nth-child(1) input').addEventListener('change', event => {
    const index = parseInt(event.target.value, 16);
    const parameterName = document.querySelector('tfoot td:nth-child(3) input');
    const objectKind = document.querySelector('tfoot td:nth-child(4) select');
    const objectCode = document.querySelector('tfoot td:nth-child(5) select');
    const addBtn = document.querySelector('tfoot td:last-child .btn');
    try {
      if (!event.target.checkValidity() || isNaN(index)) {
        event.target.value = '';
        throw 'Invalid index. Must be in hexadecimal';
      }
      if (index < 0x1000) {
        throw 'Custom data types are not supported.';
      }
      let indices = [];
      document.querySelectorAll('[data-mi]').forEach(element => {
        indices.push(parseInt(element.dataset.mi, 16));
      });
      if (indices.includes(index)) {
        throw 'Index already exists.';
      }
      parameterName.disabled = false;
      objectKind.disabled = (index >= 0x2000) && (index <= 0x5FFFF);
      objectCode.disabled = false;
      document.querySelector('tfoot td:nth-child(5) select').dispatchEvent(new Event('change'));
    } catch (error) {
      alert(error);
      parameterName.disabled = true;
      objectKind.disabled = true;
      objectCode.disabled = true;
      addBtn.disabled = true;
    }
  });

  document.querySelector('tfoot td:nth-child(5) select').addEventListener('change', event => {
    const objectType = parseInt(event.target.value);
    const dataType = document.querySelector('tfoot td:nth-child(6) select');
    const accessType = document.querySelector('tfoot td:nth-child(7) select');
    const lowLimit = document.querySelector('tfoot td:nth-child(8) input');
    const highLimit = document.querySelector('tfoot td:nth-child(9) input');
    const defaultValue = document.querySelector('tfoot td:nth-child(10) input');
    const pdoMapping = document.querySelector('tfoot td:nth-child(11) select');
    const addBtn = document.querySelector('tfoot td:last-child .btn');
    addBtn.disabled = true;
    switch (objectType) {
      case 0x0: // NULL
      case 0x6: // DEFSTRUCT
      case 0x8: // ARRAY
        dataType.disabled = true;
        accessType.disabled = true;
        lowLimit.disabled = true;
        highLimit.disabled = true;
        defaultValue.disabled = true;
        pdoMapping.disabled = true;
        break;
      case 0x2: // DOMAIN
      case 0x5: // DEFTYPE
      case 0x7: // VAR
        Array.from(dataType.options).forEach(element => {
          element.disabled = !Object.keys(CanOpen.STANDARD_DATA_TYPES).includes(element.value);
        });
        dataType.disabled = false;
        accessType.disabled = false;
        lowLimit.disabled = objectType == 0x02;
        highLimit.disabled = objectType == 0x02;
        defaultValue.disabled = false;
        pdoMapping.disabled = objectType == 0x02;
        break;
      case 0x9: // RECORD
        Array.from(dataType.options).forEach(element => {
          element.disabled = !Object.keys(CanOpen.COMPLEX_DATA_TYPES).includes(parseInt(element.value));
        });
        dataType.disabled = false;
        accessType.disabled = false;
        lowLimit.disabled = true;
        highLimit.disabled = true;
        defaultValue.disabled = true;
        pdoMapping.disabled = true;
        break;
      default:
        throw `Unsupported object type: ${event.target.value}`;
    }
    dataType.querySelector(':not(:disabled)').selected = true;
    addBtn.disabled = false;
  });

  document.querySelector('fieldset:last-child tfoot td:last-child button').addEventListener('click', event => {
    const tfoot = event.target.closest('tfoot');
    const index = tfoot.querySelector('td:first-child input');
    const objectCode = parseInt(tfoot.querySelector('td:nth-child(5) select').value);
    let html = `
<tbody data-mi="${index.value}" data-oc="${tfoot.querySelector('td:nth-child(5) select').value}">
  <tr>
    <td${[8, 9].includes(objectCode) ? ' rowspan="2"' : ''}>${index.value}<sub>h</sub></td>
    <td></td>
    <td><input type="text" maxlength="241" value="${tfoot.querySelector('td:nth-child(3) input').value}"></td>
    <td>${tfoot.querySelector('td:nth-child(4)').innerHTML}</td>
    <td>${CanOpen.OBJECT_TYPES[objectCode]}</td>
    <td>${tfoot.querySelector('td:nth-child(6)').innerHTML}</td>
    <td>${tfoot.querySelector('td:nth-child(7)').innerHTML}</td>
    <td>${tfoot.querySelector('td:nth-child(8)').innerHTML}</td>
    <td>${tfoot.querySelector('td:nth-child(9)').innerHTML}</td>
    <td>${tfoot.querySelector('td:nth-child(10)').innerHTML}</td>
    <td>${tfoot.querySelector('td:nth-child(11)').innerHTML}</td>
    <td>${tfoot.querySelector('td:nth-child(12)').innerHTML}</td>
    <td><button type="button" class="btn" data-role="remove">&#10006;</button></td>
  </tr>`;
  if ([8, 9].includes(objectCode)) {
    html += `
  <tr data-si="0">
    <td>00<sub>h</sub></td>
    <td><input type="text maxlength="241" value="Highest sub-index supported"></td>
    <td></td>
    <td>VAR</td>
    <td></td>
    <td></td>
    <td><input type="text" maxlength="244"></td>
    <td><input type="text" maxlength="243"></td>
    <td><input type="text" value="0" maxlength="242"></td>
    <td></td>
    <td></td>
    <td></td>
  </tr>`;
  }
  html += `
</tbody>`;
    tfoot.insertAdjacentHTML('beforebegin', html);
    [4, 6, 7, 11].forEach(n => {
      tfoot.previousElementSibling.querySelector(`td:nth-child(${n}) select`).selectedIndex = tfoot.querySelector(`td:nth-child(${n}) select`).selectedIndex;
    });
    [8, 9, 10].forEach(n => {
      tfoot.previousElementSibling.querySelector(`td:nth-child(${n}) input`).value = tfoot.querySelector(`td:nth-child(${n}) input`).value;
    });
    [1, 2].forEach(n => {
      const td = tfoot.previousElementSibling.querySelector('td:nth-child(12)');
      const cb = td.querySelector(`input:nth-of-type(${n})`);
      cb.checked = tfoot.querySelector(`td:nth-child(12) input:nth-of-type(${n})`).checked;
      cb.id += index.value;
      td.querySelector(`label:nth-of-type(${n})`).htmlFor += index.value;
    });
    addEventListeners(tfoot.previousElementSibling);
    index.value = '';
    tfoot.querySelectorAll('td:not(:first-child) input:not([type="checkbox"]), td:not(:first-child) select').forEach(element => element.disabled = true);
    event.target.disabled = true;
  });

  document.querySelectorAll('fieldset').forEach(element => {
    element.querySelector('legend').addEventListener('click', event => {
      element.querySelector('table').classList.toggle('show');
    });
  });

  document.querySelector('header button').addEventListener('click', event => {
    const parser = new ConfigIniParser();
    const fileName = document.querySelector('#file_name').value;
    if (!fileName) {
      alert('File Name is required');
      return;
    }

    try {
      parser.addSection('FileInfo');
      parser.set('FileInfo', 'FileName', fileName);
      parser.set('FileInfo', 'FileVersion', document.querySelector('#file_version').value); // UNSIGNED8
      parser.set('FileInfo', 'FileRevision', document.querySelector('#file_revision').value); // UNSIGNED8
      parser.set('FileInfo', 'EDSVersion', document.querySelector('#eds_version').value); // X.Y
      parser.set('FileInfo', 'Description', document.querySelector('#description').value); // 243 chars
      const creationTime = document.querySelector('#auto_creation_time').checked ? new Date(new Date() - new Date().getTimezoneOffset() * 60 * 1000).toISOString() : document.querySelector('#creation_time').value;
      parser.set('FileInfo', 'CreationTime', toTimeEDS(creationTime));
      parser.set('FileInfo', 'CreationDate', toDateEDS(creationTime));
      parser.set('FileInfo', 'CreatedBy', document.querySelector('#created_by').value); // 245 chars
      const modificationTime = document.querySelector('#auto_modification_time').checked ? new Date(new Date() - new Date().getTimezoneOffset() * 60 * 1000).toISOString() : document.querySelector('modification_time').value;
      parser.set('FileInfo', 'ModificationTime', toTimeEDS(modificationTime));
      parser.set('FileInfo', 'ModificationDate', toDateEDS(modificationTime));
      parser.set('FileInfo', 'ModifiedBy', document.querySelector('#modified_by').value); // 244 chars

      parser.addSection('DeviceInfo');
      parser.set('DeviceInfo', 'VendorName', document.querySelector('#vendor_name').value); // 244 chars
      let vendorNumber;
      if (document.querySelector('#auto_vendor_number').checked) {
        vendorNumber = document.querySelector('[data-mi="1018"] [data-si="1"] td:nth-child(9) input');
        if (!vendorNumber) {
          throw 'Vendor number entity does not exist in Identify object [1018sub1]';
        }
        vendorNumber = vendorNumber.value;
      } else {
        vendorNumber = document.querySelector('#vendor_number').value;
      }
      if (isNaN(parseInt(vendorNumber, 0))) {
        throw `Invalid Vendor Number: ${vendorNumber}`;
      }
      parser.set('DeviceInfo', 'VendorNumber', `0x${parseInt(vendorNumber, 0).toString(16).toUpperCase().padStart(8, '0')}`); // UNSIGNED32
      let productName;
      if (document.querySelector('#auto_product_name').checked) {
        productName = document.querySelector('[data-mi="1008"] tr:first-child td:nth-child(10) input');
        if (!productName) {
          throw 'Product name object does not exist [1008]';
        }
      } else {
        productName = document.querySelector('#product_name');
      }
      parser.set('DeviceInfo', 'ProductName', productName.value);
      let productNumber;
      if (document.querySelector('#auto_product_number').checked) {
        productNumber = document.querySelector('[data-mi="1018"] [data-si="2"] td:nth-child(9) input');
        if (!productNumber) {
          throw 'Product number entity does not exist in Identify object [1018sub2]';
        }
        productNumber = productNumber.value;
      } else {
        productNumber = document.querySelector('#product_number').value;
      }
      if (isNaN(parseInt(productNumber, 0))) {
        throw `Invalid Product Number: ${productNumber}`;
      }
      parser.set('DeviceInfo', 'ProductNumber', `0x${parseInt(productNumber, 0).toString(16).toUpperCase().padStart(8, '0')}`); // UNSIGNED32
      let revisionNumber;
      if (document.querySelector('#auto_revision_number').checked) {
        revisionNumber = document.querySelector('[data-mi="1018"] [data-si="3"] td:nth-child(9) input');
        if (!revisionNumber) {
          throw 'Revision number entity does not exist in Identify object [1018sub3]';
        }
        revisionNumber = revisionNumber.value;
      } else {
        revisionNumber = document.querySelector('#revision_number').value;
      }
      if (isNaN(parseInt(revisionNumber, 0))) {
        throw `Invalid Revision Number: ${revisionNumber}`;
      }
      parser.set('DeviceInfo', 'RevisionNumber', `0x${parseInt(revisionNumber, 0).toString(16).toUpperCase().padStart(8, '0')}`); // UNSIGNED32
      parser.set('DeviceInfo', 'OrderCode', document.querySelector('#order_code').value);
      document.querySelectorAll('#baud_rates option').forEach(element => {
        parser.set('DeviceInfo', `BaudRate_${element.value}`, element.selected ? '1' : '0'); // BOOLEAN
      });
      parser.set('DeviceInfo', 'SimpleBootUpMaster', document.querySelector('#bootup_master').checked ? '1' : '0'); // BOOLEAN
      parser.set('DeviceInfo', 'SimpleBootUpSlave', document.querySelector('#bootup_slave').checked ? '1' : '0'); // BOOLEAN
      parser.set('DeviceInfo', 'Granularity', document.querySelector('#granularity').value); // UNSIGNED8
      parser.set('DeviceInfo', 'DynamicChannelsSupported', '0'); // Not specified
      parser.set('DeviceInfo', 'GroupMessaging', '0'); // BOOLEAN
      parser.set(
        'DeviceInfo',
        'NrOfRxPDO',
          document.querySelector('#auto_rx_pdos').checked ? document.querySelectorAll('[data-mi^="14"], [data-mi^="15"]').length : document.querySelector('#rx_pdos')
      ); // UNSIGNED16
      parser.set(
        'DeviceInfo',
        'NrOfTxPDO',
          document.querySelector('#auto_tx_pdos').checked ? document.querySelectorAll('[data-mi^="18"], [data-mi^="19"]').length : document.querySelector('#tx_pdos')
      ); // UNSIGNED16
      parser.set('DeviceInfo', 'LSS_Supported', document.querySelector('#lss').checked ? '1' : '0'); // BOOLEAN

      parser.addSection('DummyUsage');
      document.querySelectorAll('#dummy_usage option').forEach(element => {
        parser.set('DummyUsage', `Dummy000${element.value}`, element.selected ? '1' : '0'); // BOOLEAN
      });

      const comments = document.querySelector('#comments').value.split('\n');
      if (comments.length && !(comments.length == 1 && comments[0] == '')) {
        if (comments.length > 2**16) {
          throw new `Comments limited to ${2**16} lines`;
        }
        parser.addSection('Comments');
        parser.set('Comments', 'Lines', comments.length);
        comments.forEach((line, index) => {
          if (line.length > 249) {
            throw 'Comment lines are limited to 249 characters';
          }
          parser.set('Comments', `Line${index + 1}`, line);
        });
      }

      const mandatoryObjects = [];
      const optionalObjects = [];
      const manufacturerObjects = [];
      document.querySelectorAll('[data-mi]').forEach(element => {
        if (element.dataset.mi.match(/^1|[6-9]/)) {
           if (element.querySelector('td:nth-child(4) select').value == 'mandatory') {
             mandatoryObjects.push(element.dataset.mi);
           } else {
             optionalObjects.push(elements.dataset.mi);
           }
        } else {
          manufacturerObjects.push(element.dataset.mi);
        }
      });

      if (mandatoryObjects.length) {
        parser.addSection('MandatoryObjects');
        parser.set('MandatoryObjects', 'SupportedObjects', mandatoryObjects.length); // UNSIGNED16
        mandatoryObjects.forEach((element, index) => {
          parser.set('MandatoryObjects', index + 1, `0x${element}`);
          saveObject(parser, element);
         });
      }

      if (optionalObjects.length) {
        parser.addSection('OptionalObjects');
        parser.set('MandatoryObjects', 'SupportedObjects', optionalObjects.length); // UNSIGNED16
        optionalObjects.forEach((element, index) => {
          parser.set('OptionalObjects', index + 1, `0x${element}`);
          saveObject(parser, element);
         });
      }

      if (manufacturerObjects.length) {
        parser.addSection('ManufacturerObjects');
        parser.set('ManufacturerObjects', 'SupportedObjects', manufacturerObjects.length); // UNSIGNED16
        manufacturerObjects.forEach((element, index) => {
          parser.set('ManufacturerObjects', index + 1, `0x${element}`);
          saveObject(parser, element);
         });
      }
    } catch (error) {
      alert(error);
      throw error;
    }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([parser.stringify()], { type: 'text/plain'}));
    a.download = fileName;
    a.style.display = 'none';
    document.body.append(a);
    a.dispatchEvent(new MouseEvent('click'));
    a.remove();
  });

  const parser = new ConfigIniParser();
  parser.parse(`[MandatoryObjects]
SupportedObjects=3
1=0x1000
2=0x1001
3=0x1018

[1000]
ParameterName=Device type
DataType=7
AccessType=ro

[1001]
ParameterName=Error register
DataType=5
AccessType=ro

[1018]
ParameterName=Identity object
ObjectType=9
SubNumber=2

[1018sub0]
ParameterName=Highest sub-index supported
DataType=5
AccessType=ro
DefaultValue=1

[1018sub1]
ParameterName=Vendor-ID
DataType=7
AccessType=ro
`);

  loadObject(parser, '1000');
  loadObject(parser, '1001');
  loadObject(parser, '1018');

  addEventListeners(document);
});
