var Editor = $.fn.dataTable.Editor = function(config) {
  config = config || {};
  if (!config.domTable) return alert("Missing editor domTable !");

  this.domTable = config.domTable;
  this.method = config.method || "POST";
  this.url = config.url || "";
  this.idField = config.idField;
  this.done = config.done || done;
  this.fail = config.fail || fail;

  this.title = config.title || "";
  this.fields = config.fields || [];
  this.closeText = config.closeText || "close";
  this.validateText = config.validateText || "validate";

  this.formValidation = config.formValidation || function() {return true;};

  _buildModal.call(this);
  this.create = _create.bind(this);
  this.edit = _edit.bind(this);
  this.remove = _remove.bind(this);
  this.error = _setError.bind(this);
}

function _resetErrorField(form) {
  form.find('[id^=error]').each(function() {
	$(this).html("");
  });
}

function _setError(field, message) {
	this.form.find('#error'+field).html(message);
}

// Modal
function _buildModal() {
  this.modal = $('<div class="modal fade", tabindex="-1", role="dialog", aria-hidden="true"/>')
    .appendTo($(this.domTable));

  var modalHeader = $('<div class="modal-header"/>')
    .appendTo(this.modal);
  $('<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times</button>')
    .appendTo(modalHeader);
  $('<h3/>').appendTo(modalHeader).text(this.title || '');

  var modalBody = $('<div class="modal-body"/>').appendTo(this.modal);
  var form = this.form = $('<form class="form-horizontal"/>').appendTo(modalBody)
    .attr('method', this.method).attr('url', this.url);
  for(var index = 0; index < this.fields.length; ++index) {
	  var f = this.fields[index];
	  if (f.name)
		  f.name = getDataName(f.name);
    addField(this.form, f);
  }
  var errorBlock = this.errorBlock = $('<div class="alert alert-error hide">')
    .appendTo(modalBody);
  this.error = $('<span id="error-span"/>')
    .appendTo(this.errorBlock);

  var modalFooter = $('<div class="modal-footer"/>')
    .appendTo(this.modal);
  $('<button class="btn", data-dismiss="modal", aria-hidden="true"/>')
    .appendTo(modalFooter).text(this.closeText);
  var validateButton = this.validateButton = $('<button class="btn btn-primary"/>').
    appendTo(modalFooter).text(this.validateText);

  this.modal.on('hide', function() {
    validateButton.off('click');
    _resetErrorField(form);
    errorBlock.fadeOut();
    clearData(form);
  });
}

// Execute Methods

function _create() {
  var self = this;
  self.validateButton.on('click', function() {
    var data = retrieveData(self.form);
  if (self.formValidation.call(self, data)) {
    $.ajax({
      type: self.method,
      url: self.url,
      data: data
    }).done(self.done.bind(self)).fail(self.fail.bind(self));
  }
  });
  self.modal.modal();

}

function _edit(selectedRowData) {
  var self = this;
  addDefault(self.form, selectedRowData);
  self.validateButton.on('click', function() {
    var data = retrieveData(self.form);
    if (self.formValidation.call(self, data)) {
    if (self.idField && selectedRowData) data.id = selectedRowData[self.idField];
    $.ajax({
      type: self.method,
      url: self.url,
      data: data
    }).done(self.done.bind(self)).fail(self.fail.bind(self));
  }
  });
  self.modal.modal();
}

function _remove(selectedRowsData) {
    var self = this;
    self.validateButton.on('click', function() {
      var data = { ids: [] };
      if (self.idField && selectedRowsData) {
        for (var index = 0; index < selectedRowsData.length; ++index)
          data.ids.push(selectedRowsData[index][self.idField]);
      }
      $.ajax({
        type: self.method,
        url: self.url,
        data: data
      }).done(self.done.bind(self)).fail(self.fail.bind(self));
    });
  self.modal.modal();
}

// Request over method

function done() {
  this.modal.modal('hide');
  $(this.domTable).dataTable().fnReloadAjax();
}

function fail(jqXHR) {
  if (jqXHR.status == 403) {
    this.error.text(jqXHR.responseText);
    this.errorBlock.fadeIn();
  } else {
    document.open();
    document.write(jqXHR.responseText);
    document.close();
  }
}

// Data Management

function getDataName(name) {
	// var n = name.indexOf('[');
	// if (n != -1) {
	// 	name = name.substr(0, n)+'.'+name.substr(n+1, (name.length-n-2));
	// }
	var n = name.indexOf('.');
	if (n != -1) {
		name = name.substr(0,n)+'['+name.substr(n+1, (name.length-n))+']';
	}
	return name;
}

function retrieveData(form) {
  var data = {}
  form.find('input').each(function() {
    if (~['text', 'password'].indexOf($(this).attr('type'))) {
		data[$(this).attr('name')] = $(this).val();
    } else if (~['checkbox'].indexOf($(this).attr('type'))) {
		data[$(this).attr('name')] = $(this).prop('checked');
    }
  });
	form.find('textarea').each(function() {
		data[$(this).attr('name')] = $(this).val();
	});
  return data;
}

function addDefault(form, data) {
  form.find('input').each(function() {
	  var val = $(this).attr('name');
	  if (val.indexOf(']') != -1) {
		  val = val.substr(0, (val.length-1)).replace('[', '.');
	  }
	  eval('val = data.'+val);
    if (~['text', 'password'].indexOf($(this).attr('type'))) {
		$(this).val(val);
    } else if (~['checkbox'].indexOf($(this).attr('type'))) {
		$(this).prop('checked', val);
    }
  });
	form.find('textarea').each(function() {
	  var val = $(this).attr('name');
	  if (val.indexOf(']') != -1) {
		  val = val.substr(0, (val.length-1)).replace('[', '.');
	  }
	  eval('val = data.'+val);
		$(this).val(val);
	});
}

function clearData(form) {
  form.find('input').each(function() {
    if (~['text', 'password'].indexOf($(this).attr('type'))) {
      $(this).val("");
    } else if (~['checkbox'].indexOf($(this).attr('type'))) {
      $(this).prop('checked', false);
    }
  });
	form.find('textarea').each(function() {
        $(this).val("");
    });
}


// Field Management

function addField(form, field) {
  var group = $('<div class="control-group"/>').appendTo(form);
  if (field.fieldType == 'label') addLabelField(group, field);
  else if (field.fieldType == 'input') {
    if (field.type == 'text') addTextField(group, field);
    else if (field.type == 'password') addPasswordField(group, field);
    else if (field.type == 'checkbox') addCheckboxField(group, field);
    else if (field.type == 'textarea') addTextareaField(group, field);
  } else console.error("Field type", field.type, "not managed !");
}

function addLabelField(group, field) {
  $('<label class="control-label"/>').appendTo(group).text(field.label);
}

function addTextareaField(group, field) {
	if (field.label)
		$('<label class="control-label"/>').appendTo(group).text(field.label);
	$('<textarea/>').appendTo($('<div class="controls"/>').appendTo(group))
		.attr('name', field.name).val();
}

function addTextField(group, field) {
  if (field.label)
    $('<label class="control-label"/>').appendTo(group).text(field.label);
  var ctl = $('<div class="controls"/>').appendTo(group)
  $('<input type="text"/>').attr('name', field.name).appendTo(ctl);
  $('<div class="error"/>').attr('id', 'error'+field.name).appendTo(ctl);
    
}

function addPasswordField(group, field) {
  if (field.label)
    $('<label class="control-label"/>').appendTo(group).text(field.label);
  var ctl = $('<div class="controls"/>').appendTo(group);
  $('<input type="password"/>').appendTo(ctl).attr('name', field.name);
  $('<div class="error"/>').attr('id', 'error'+field.name).appendTo(ctl);
}

function addCheckboxField(group, field) {
  $('<input type="checkbox"/>').appendTo(
      $('<label class="checkbox"/>').appendTo(
        $('<div class="controls"/>').appendTo(group)))
    .attr('name', field.name)
    .after(field.label);
}

/*
 * Extend DataTable
 */

$.fn.dataTableExt.oApi.fnReloadAjax = function(oSettings, sNewSource) {
  if (typeof sNewSource != 'undefined') {
    oSettings.sAjaxSource = sNewSource;
  }
  this.fnClearTable(this);
  this.oApi._fnProcessingDisplay(oSettings, true);
  $.getJSON(oSettings.sAjaxSource, null, $.proxy(function(json) {
    for (var i=0 ; i<json.aaData.length ; i++) {
		this.oApi._fnAddData(oSettings, json.aaData[i]);
    }
    oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
    this.fnDraw(this);
    this.oApi._fnProcessingDisplay(oSettings, false);
  }, this));
}

/*
 * Extend TableTool
 */

TableTools.BUTTONS.new_button = $.extend(true, "new_button", TableTools.buttonBase, {
  sButtonText: "New",
  sButtonClass: "btn",
  editor: null,
  fnClick: create
});

TableTools.BUTTONS.edit_button = $.extend(true, "edit_button", TableTools.buttonBase, {
  sButtonText: "Edit",
  sButtonClass: "btn disabled",
  fnSelect: ActifSelectSingle,
  editor: null,
  fnClick: edit
});

TableTools.BUTTONS.remove_button = $.extend(true, "remove_button", TableTools.buttonBase, {
  sButtonText: "Remove",
  sButtonClass: "btn disabled",
  fnSelect: ActifSelect,
  editor: null,
  fnClick: remove
});

function ActifSelectSingle(button, config, rows) {
  var oneSelected = this.fnGetSelected().length == 1;
  if (oneSelected) $(button).removeClass('disabled');
  else $(button).addClass('disabled');
}

function ActifSelect(button, config, rows) {
  var oneSelected = this.fnGetSelected().length > 0;
  if (oneSelected) $(button).removeClass('disabled');
  else $(button).addClass('disabled');
}

function create(nButton, oConfig, oFlash) {
  if (!$(nButton).hasClass('disabled') && oConfig.editor) {
    oConfig.editor.create();
  }
}

function edit(nButton, oConfig, oFlash) {
  if (!$(nButton).hasClass('disabled') && oConfig.editor) {
      var selectedData = this.fnGetSelectedData();
    if (selectedData.length != 1)
      return console.error("Internal Error: edit cannot be called against more or less than 1 row !");
    selectedData = selectedData[0];
    oConfig.editor.edit(selectedData);
  }
}

function remove(nButton, oConfig, oFlash) {
  if (!$(nButton).hasClass('disabled') && oConfig.editor) {
    var selectedData = this.fnGetSelectedData();
    oConfig.editor.remove(selectedData);
  }
}
