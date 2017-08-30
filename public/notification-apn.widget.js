$.widget('o2.apn', {
  options: {
    pushButton: undefined,
    result: undefined,
    jwtToken: undefined,
    preferencesForm: undefined,
    preferenceOptionsSection: undefined,
    pushId: undefined,
    hostname: undefined,
    preferenceOptions: ['Type A', 'Type B', 'Type C'],
    // Change these options and the default value of 'preferences' in DB to modify the preferences
    isSubscribed: false
  },

  _create: function() {
    if ('safari' in window && 'pushNotification' in window.safari) {
      // console.log('APNs is supported');
      this.initialiseUI();

      this.options.preferencesForm.on('submit', (event) => {
        this.updateSubscriptionPreferences(event);
      });

      this.generatePreferencesOptions();
    } else {
      // console.warn('Push messaging is not supported');
      this.options.pushButton.text('APNs Not Supported');
      this.options.pushButton.css('display', 'none');

      return;
    }
  },

  // Initialises the UI according to user subscribed or not
  // These UI updates include updating the button
  // and showing or hiding the notification preferences section.
  initialiseUI: function() {
    // console.log(this.options.pushButton);
    let permissionData = window.safari.pushNotification.permission(this.options.pushId);
    this.options.pushButton.on('click', () => {
      this.options.result.html('');
      this.options.pushButton.prop('disabled', true);
      if (this.options.isSubscribed) {
        this.unsubscribeUser(permissionData);
      } else {
        this.subscribeUser(permissionData);
      }
    });

    if (permissionData.permission === 'granted') {
      this.options.isSubscribed = true;
      this.options.preferencesForm['0'].classList.remove('is-invisible');
      this.getPreferences(permissionData.deviceToken);
    }

    this.updateBtn();
  },

  // The preferences options on the web page are generated dynamically from this function
  generatePreferencesOptions: function() {
    let prefOptionsHTML = '';
    for (let i = 1; i <= this.options.preferenceOptions.length; i++) {
      prefOptionsHTML += '<input type="checkbox" id="type' + i +'">'
        + '<label for="type' + i + '">' + this.options.preferenceOptions[i-1] + '</label><br><br>';
    }

    this.options.preferenceOptionsSection.html(prefOptionsHTML);
  },

  // Updates the button according to user subscribed or not
  updateBtn: function() {
    if (this.options.isSubscribed) {
      this.options.pushButton.text('Disable Push Messaging');
    } else {
      this.options.pushButton.text('Enable Push Messaging');
    }

    this.options.pushButton.prop('disabled', false);
  },

  /*
  Prompts the user to 'Allow' or 'Deny' receiving notifications.
  After the user makes a decision, the same function is again run as a callback
  and the preferences section and push button are updated according to user's choice.
  */
  subscribeUser: function(permissionData) {
    if (permissionData.permission === 'default') {
      // console.log("The user is making a decision");
      window.safari.pushNotification.requestPermission(
        this.options.hostname,
        this.options.pushId,
        {},
        (permissionData) => {
          this.subscribeUser(permissionData);
        }
      );
    } else if (permissionData.permission === 'denied') {
      this.updateBtn();
      // console.log("Permission Denied.");
    } else if (permissionData.permission === 'granted') {
      // console.log("The user said yes, with token: " + permissionData.deviceToken);

      this.options.isSubscribed = true;
      this.options.preferencesForm['0'].classList.remove('is-invisible');
      this.getPreferences(permissionData.deviceToken);

      this.updateBtn();
    }
  },

  // Currently incomplete. Find a method to remove notification 
  // permissions from Safari preferences, if possible.
  unsubscribeUser: function(permissionData) {
    // window.safari.pushNotification.permission(this.options.pushId).permission = "denied";
    // console.log(window.safari.pushNotification.permission(this.options.pushId).permission);
    // $.ajax({
    //   url: 'v1/devices/' + permissionData.deviceToken + '/registrations/' + this.options.pushId,
    //   type: 'DELETE',
    //   success: function(data) {
    //     console.log(data);
    //   }
    // });
  },

  // Gets current user preferences from the database and
  // updates the preferences form according to them.
  getPreferences: function(deviceToken) {
    let data = {
      deviceToken: deviceToken
    };

    return fetch('/api/get-preferences-safari?token=' + this.options.jwtToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then((response) => {
        response.json()
          .then((data) => {
            let preferences = data[0].preferences.split('');

            if (preferences.length == this.options.preferenceOptions.length) {
              for (let i = 1; i <= preferences.length; i++) {
                (preferences[i-1] == 1) ? ($('#type' + i).prop('checked', true))
                  : ($('#type' + i).prop('checked', false));
              }
            } else {
              throw new Error('Number of preferences on HTML page and Database don\'t match.'
                + 'Please see the database structure.');
            }
          });
      });
  },

  updateSubscriptionPreferences: function(event) {
    event.preventDefault();

    let permissionData = window.safari.pushNotification.permission(this.options.pushId);

    if (permissionData.permission === 'granted') {
      let data = {
        deviceToken: permissionData.deviceToken,
        preferences: this.compilePreferences()
      };

      return fetch('/api/update-preferences-safari?token=' + this.options.jwtToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Couldn\'t update preferences');
          }
          this.options.result.html('<h3>Preferences Updated.</h3>');
          // console.log(response.body);
        });
    } else {
      // console.log('Error updating preferences: No subscription');
    }
  },

  compilePreferences: function() {
    let preferences = '';

    for (let i = 1; i <= this.options.preferenceOptions.length; i++) {
      ($('#type' + i).prop('checked')) ? (preferences += 1) : (preferences += 0);
    }

    return preferences;
  }
});
