/* global Uint8Array */

$.widget('o2.pushNotification', {
  options: {
    applicationServerPublicKey: undefined,
    pushButton: undefined,
    result: undefined,
    jwtToken: undefined,
    preferencesForm: undefined,
    preferenceOptionsSection: undefined,
    preferenceOptions: ['Type A', 'Type B', 'Type C'],
    // Change these options and the default value of 'preferences' in DB to modify the preferences
    isSubscribed: false,
    swRegistration: null
  },

  _create: function() {
    // Check if the service worker functionality is available in the browser
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // console.log('Service Worker and Push is supported');


      navigator.serviceWorker.register('notification-vapid-sw.js')
        .then((swReg) => {
          // console.log('Service Worker is registered', swReg);

          this.options.swRegistration = swReg;
          this.initialiseUI();


          this.options.preferencesForm.on('submit', (event) => {
            this.updateSubscriptionPreferences(event);
          });

          this.generatePreferencesOptions();
        })
        .catch(function(error) {
          // console.error('Service Worker Error', error);
        });
    } else {
      // console.warn('Push messaging is not supported');
      this.options.pushButton.text('Push Not Supported');
      this.options.pushButton.css('display', 'none');

      return;
    }

    if (Notification.permission === 'denied') {
      if (this.options.swRegistration != undefined) {
        this.unsubscribeUser();
      }
    }
  },

  // Initialises the UI according to user subscribed or not
  // These UI updates include updating the button
  // and showing or hiding the notification preferences section.
  initialiseUI: function() {
    this.options.pushButton.on('click', () => {
      this.options.result.html('');
      this.options.pushButton.prop('disabled', true);
      if (this.options.isSubscribed) {
        this.unsubscribeUser();
      } else {
        this.subscribeUser();
      }
    });

    // Set the initial subscription value
    this.options.swRegistration.pushManager.getSubscription()
      .then((subscription) => {
        this.options.isSubscribed = !(subscription === null);

        if (this.options.isSubscribed) {
          // console.log('User IS subscribed.');
          this.options.preferencesForm['0'].classList.remove('is-invisible');
          this.getPreferences();
        } else {
          // console.log('User is NOT subscribed.');
        }

        this.updateBtn();
      });
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
    if (Notification.permission === 'denied') {
      this.options.pushButton.text('Push Messaging Blocked.');
      this.options.pushButton.prop('disabled', true);
      return;
    }

    if (this.options.isSubscribed) {
      this.options.pushButton.text('Disable Push Messaging');
    } else {
      this.options.pushButton.text('Enable Push Messaging');
    }

    this.options.pushButton.prop('disabled', false);
  },

  // Subscribes the user
  subscribeUser: function() {
    let applicationServerKey = this.urlB64ToUint8Array(this.options.applicationServerPublicKey);

    /*
    This is the standard call for subscribing a user on 'web-push' Server.
    The Application Server Public key is associated with the subscription
    and when a push request is made, the corressponding Private Key
    is used to verify the origin of the request.
    It returns a Promise.
    */
    return this.options.swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })
      .then((pushSubscription) => {
        // console.log('User is subscribed on \'web-push\' server.',

        this.addSubscription(pushSubscription);

        this.options.isSubscribed = true;

        this.updateBtn();

        pushSubscription = JSON.stringify(pushSubscription);
      })
      .catch((err) => {
        // console.log('Failed to subscribe the user: ', err);
        this.updateBtn();
      });
  },

  addSubscription: function(subscription) {
    return fetch('/api/save-subscription?token=' + this.options.jwtToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Bad status code from server.');
        }
        return response.json();
      })
      .then((responseData) => {
        if (!(responseData.data && responseData.data.success)) {
          throw new Error('Bad response from server.');
        }
        // console.log('User subscribed on application server');

        this.options.preferencesForm['0'].classList.remove('is-invisible');
        this.getPreferences();
      });
  },

  // Unsubscribing the user
  unsubscribeUser: function() {
    this.options.swRegistration.pushManager.getSubscription()
      .then((subscription) => {
        if (subscription) {
          // Unsubscribing on the 'web-push' Server
          subscription.unsubscribe()
            .then(() => {
              // console.log('Unsubscribed from \'web-push\' Server.');

              // Unsubscribing on the Application Server
              fetch('/api/delete-subscription?token=' + this.options.jwtToken, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
              })
                .then(function() {
                  // console.log('Unsubscribed from Application Server.');
                  return true;
                })
                .catch(function(err) {
                  // console.log('Could not unsubscribe on application server. Error: ', err);
                  throw err;
                });
            })
            .catch(function(err) {
              // console.log('Could not unsubscribe on \'web-push\' server. Error: ', err);
              throw err;
            });
        }
      })
      .then(() => {
        this.options.preferencesForm['0'].classList.add('is-invisible');
        // console.log('User is unsubscribed.');
        this.options.isSubscribed = false;
        this.updateBtn();
      })
      .catch(function(error) {
        // console.log('Error unsubscribing', error);
      });
  },

  updateSubscriptionPreferences: function(event) {
    event.preventDefault();

    this.options.swRegistration.pushManager.getSubscription()
      .then((subscription) => {
        if (subscription) {
          let data = {
            endpoint: subscription.endpoint,
            preferences: this.compilePreferences()
          };

          return fetch('/api/update-preferences?token=' + this.options.jwtToken, {
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
      });
  },

  // Gets current user preferences from the database and 
  // updates the preferences form according to them.
  getPreferences: function() {
    this.options.swRegistration.pushManager.getSubscription()
      .then((subscription) => {
        if (subscription) {
          let data = {
            endpoint: subscription.endpoint
          };

          return fetch('/api/get-preferences?token=' + this.options.jwtToken, {
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
        } else {
          throw new Error('Error updating preferences: No subscription');
          // console.log('Error updating preferences: No subscription');
        }
      });
  },

  compilePreferences: function() {
    let preferences = '';

    for (let i = 1; i <= this.options.preferenceOptions.length; i++) {
      ($('#type' + i).prop('checked')) ? (preferences += 1) : (preferences += 0);
    }

    return preferences;
  },

  urlB64ToUint8Array: function(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
});
