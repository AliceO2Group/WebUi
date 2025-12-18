/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { HttpServer } from '@aliceo2/web-ui';

import CentralSystem from './dist/modules/CentralSystem.js';
import { mockTokens, mockTokenLogs, mockServices, mockServiceRoutes } from './mocks.js';
import { X509Certificate } from 'crypto';


const http = new HttpServer({ port: 8080, allow: '*' });

http.get(
  '/healthcheck',
  (req, res) => {
    res.status(200).send();
  },
  { public: true }
);

const centralSystemModel = new CentralSystem(4041);
// below /tokens with filtering http.get('/tokens')
http.get(
  '/tokens/get',
  centralSystemModel.tokenController.getTokensHandler.bind(
    centralSystemModel.tokenController
  ),
  {
    public: true,
  }
);

// Not needed ??
http.post(
  '/tokens/create',
  centralSystemModel.tokenController.createTokenHandler.bind(
    centralSystemModel.tokenController
  ),
  { public: true }
);

// This one need to be split into one that accepts 
// revocation by tokenId and another by filtering criteria 
http.post(
  '/tokens/revoke',
  centralSystemModel.tokenController.revokeTokenHandler.bind(
    centralSystemModel.tokenController
  ),
  { public: true }
);


http.get( 
  '/tokens',
  (req, res) => {
    const {
      serviceFrom,
      serviceTo,
      issuedAfter,
      issuedBefore,
      expiresAfter,
      expiresBefore,
      status,
      ordering,
    } = req.query;

    let filteredTokens = [...mockTokens];

    if (serviceFrom) {
      const serviceFromFilters = serviceFrom.split(',');
      if (serviceFromFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => 
          serviceFromFilters.includes(token.serviceFrom?.serviceId) || 
          serviceFromFilters.includes(token.serviceFrom?.commonName)
        );
      }
    }

    if (serviceTo) {
      const serviceToFilters = serviceTo.split(',');
      if (serviceToFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => 
          serviceToFilters.includes(token.serviceTo?.serviceId) || 
          serviceToFilters.includes(token.serviceTo?.commonName)
        );
      }
    }

    if (issuedAfter) {
      filteredTokens = filteredTokens.filter(token => new Date(token.iat) >= new Date(issuedAfter));
    }

    if (issuedBefore) {
      filteredTokens = filteredTokens.filter(token => new Date(token.iat) <= new Date(issuedBefore));
    }

    if (expiresAfter) {
      filteredTokens = filteredTokens.filter(token => new Date(token.exp) >= new Date(expiresAfter));
    }

    if (expiresBefore) {
      filteredTokens = filteredTokens.filter(token => new Date(token.exp) <= new Date(expiresBefore));
    }

    if (status) {
      const statusFilters = Array.isArray(status) ? status : [status];
      if (statusFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => statusFilters.includes(token.status));
      }
    }

    if (ordering) {
      const sortFields = Array.isArray(ordering) ? ordering : [ordering];
      filteredTokens.sort((a, b) => {
        for (const field of sortFields) {
          const [key, directionStr] = field.split(':');
          const direction = directionStr === 'desc' ? -1 : 1;

          const valA = a[key];
          const valB = b[key];

          if (valA < valB) return -1 * direction;
          if (valA > valB) return 1 * direction;
        }
        return 0;
      });
    }

    setTimeout(() => res.status(200).json(filteredTokens), 500);
  },
  { public: true }
);

http.get(
  '/tokens/:tokenId',
  (req, res) => {
    const tokenId = req.params.tokenId;
    const token = mockTokens.find(t => t.tokenId === tokenId) ?? null;

    if (!token) {
      res.status(404).json({ error: `No token found with id ${tokenId}` });
      return;
    }

    res.status(200).json(token);
  },
  { public: true }
);

http.get(
  '/tokens/:tokenId/logs',
  (req, res) => {
    const tokenId = req.params.tokenId;

    const logs = mockTokenLogs[tokenId] ?? [];

    if (!logs) {
      res
        .status(404)
        .json({ error: `No logs found for token ${tokenId}` });
      return;
    }

    setTimeout(() => res.status(200).json(logs), 500);
  },
  { public: true }
);

http.get('/services', (req, res) => {
  let filteredServices = [...mockServices];

  const {
    searchTerm,
    issuedBefore,
    issuedAfter,
    expiresBefore,
    expiresAfter,
    ordering
  } = req.query;

  if (searchTerm) {
    filteredServices = filteredServices.filter(service =>
      service.commonName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (issuedAfter) {
    filteredServices = filteredServices.filter(service => new Date(service.iat) >= new Date(issuedAfter));
  }

  if (issuedBefore) {
    filteredServices = filteredServices.filter(service => new Date(service.iat) <= new Date(issuedBefore));
  }

  if (expiresAfter) {
    filteredServices = filteredServices.filter(service => new Date(service.exp) >= new Date(expiresAfter));
  }

  if (expiresBefore) {
    filteredServices = filteredServices.filter(service => new Date(service.exp) <= new Date(expiresBefore));
  }

  if (ordering) {
    const sortFields = Array.isArray(ordering) ? ordering : [ordering];
    filteredServices.sort((a, b) => {
      for (const field of sortFields) {
        const [key, directionStr] = field.split(':');
        const direction = directionStr === 'desc' ? -1 : 1;

        const valA = a[key];
        const valB = b[key];

        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
      }
      return 0;
    });
  }

  setTimeout(() => res.status(200).json(filteredServices), 500);
}, { public: true });

http.get('/services/:serviceId', (req, res) => {
  const serviceId = req.params.serviceId;
  const service = mockServices.find(s => s.serviceId === serviceId) ?? null;

  if (!service) {
    res.status(404).json({ error: `No service found with id ${serviceId}` });
    return;
  }

  res.status(200).json(service);
}, { public: true });

http.post('/certificate', (req, res) => {
  const {certificateBase64} = req.body;

  if (!certificateBase64) {
    res.status(200).json({ error: 'certificateBase64 is required' });
    return;
  }

  // reading certificate 
  const bytes = Buffer.from(certificateBase64, 'base64');
  const cert = new X509Certificate(bytes);


  // you should save certificate as file somewhere and after
  // registering send it to vault
  res.status(200).json({
    certificateId: '1', // TODO: generate for saved in DB
    subject: cert.subjectAltName,
    commonName: cert.subjectAltName,
    issuer: cert.issuer,
    validFrom: cert.validFrom,
    validTo: cert.validTo,
    fingerprint: cert.fingerprint,
    status: 'pending' // TODO: implement certificate status management
  });
  
}, { public: true });

http.post('/certificate/register', (req, res) => {
  // its certifacateId from /certificate endpoint
  const {certificateId} = req.body;

  if (!certificateId) {
    res.status(400).json({ error: 'certificateId is required' });
    return;
  }

  return res.send({success: true}); // system is registered mock
}, { public: true });

http.post('/certificate/renew', (req, res) => {
  // its certifacateId from /certificate endpoint
  // you need to update service data: issuedAt, expiresAt
  // and also update certificate in vault
  const {
    certificateId,
    serviceId
  } = req.body;
  if (!certificateId) {
    res.status(400).json({ error: 'certificateId is required' });
    return;
  }

  return res.send({
    success: true,
    certificateId,
    serviceId,
    status: 'renewed'
  }); // system is renewing (changing) certificate
}, { public: true });

http.get('/routes', (req, res) => {
  let filteredRoutes = [...mockServiceRoutes]

  const {
    serviceFrom,
    serviceTo,
  } = req.query; // Changed to query

      if (serviceFrom) {
      const serviceFromFilters = serviceFrom.split(',');
      if (serviceFromFilters.length > 0) {
        filteredRoutes = filteredRoutes.filter(route => 
          serviceFromFilters.includes(route.serviceFrom?.serviceId) || 
          serviceFromFilters.includes(route.serviceFrom?.commonName)
        );
      }
    }

    if (serviceTo) {
      const serviceToFilters = serviceTo.split(',');
      if (serviceToFilters.length > 0) {
        filteredRoutes = filteredRoutes.filter(route => 
          serviceToFilters.includes(route.serviceTo?.serviceId) || 
          serviceToFilters.includes(route.serviceTo?.commonName)
        );
      }
    }

  // important to return id of route for banning/deleting (its the same)
  return res.status(200).json(filteredRoutes);
}, { public: true });

http.post('/routes', (req, res) => {
  const {
    serviceFromId: serviceFrom, // id
    serviceToId: serviceTo, // id
    permissions
  } = req.body;

  if (!serviceFrom || !serviceTo || !permissions) {
    res.status(400).json({ error: 'serviceFrom, serviceTo and permissions are required' });
    return;
  }

  const serviceFromObj = mockServices.find(s => s.serviceId === serviceFrom || s.commonName === serviceFrom);
  const serviceToObj = mockServices.find(s => s.serviceId === serviceTo || s.commonName === serviceTo);

  if (!serviceFromObj || !serviceToObj) {
    res.status(400).json({ error: 'Invalid serviceFrom or serviceTo' });
    return;
  }

  const newRoute = {
    routeId: `route-${(mockServiceRoutes.length + 1).toString().padStart(3, '0')}`,
    serviceFrom: serviceFromObj,
    serviceTo: serviceToObj,
    permissions
  };

  mockServiceRoutes.push(newRoute);
  // you can even return the all data from created route
  res.status(201).json(newRoute);
}, { public: true });

// two endpoints for deleting route similar
// to revoking token by id or by filtering criteria

http.delete('/routes/:routeId', (req, res) =>{
  const index = mockServiceRoutes.findIndex(route => route.routeId === req.params.routeId);
  if (index !== -1) {
    mockServiceRoutes.splice(index, 1);
  }

  
  return res.send({success: true});
}, { public: true });

// bulk delete
http.delete('/routes', (req, res) => {
  
  let {
    serviceFrom,
    serviceTo
  } = req.query;

  
  serviceFrom = serviceFrom ? serviceFrom.split(',') : [];
  serviceTo = serviceTo ? serviceTo.split(',') : [];

  for (let i = mockServiceRoutes.length - 1; i >= 0; i--) {
    const route = mockServiceRoutes[i];
    if (
      serviceFrom.includes(route.serviceFrom?.serviceId || '') ||
      serviceFrom.includes(route.serviceFrom?.commonName || '') ||
      serviceTo.includes(route.serviceTo?.serviceId || '') ||
      serviceTo.includes(route.serviceTo?.commonName || '')
    ) {
      mockServiceRoutes.splice(i, 1);
    }
  }

  return res.send({ success: true });
}, { public: true });


http.delete('/tokens/:tokenId', (req, res) => {
  const {
    tokenId
  } = req.params;
  let revokedToken = mockTokens.find(token => token.tokenId === tokenId);
  if (!revokedToken) {
    return res.status(404).send({ error: 'Token not found' });
  }
  revokedToken.status = 'not-active';
  return res.send({success: true});
}, { public: true });

// bulk delete
http.delete('/tokens', (req, res) => {

   const {
      serviceFrom,
      serviceTo,
      issuedAfter,
      issuedBefore,
      expiresAfter,
      expiresBefore,
      status,
    } = req.query;

    let filteredTokens = [...mockTokens];

    if (serviceFrom) {
      const serviceFromFilters = serviceFrom.split(',');
      if (serviceFromFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => 
          serviceFromFilters.includes(token.serviceFrom?.serviceId) || 
          serviceFromFilters.includes(token.serviceFrom?.commonName)
        );
      }
    }

    if (serviceTo) {
      const serviceToFilters = serviceTo.split(',');
      if (serviceToFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => 
          serviceToFilters.includes(token.serviceTo?.serviceId) || 
          serviceToFilters.includes(token.serviceTo?.commonName)
        );
      }
    }

    if (issuedAfter) {
      filteredTokens = filteredTokens.filter(token => new Date(token.iat) >= new Date(issuedAfter));
    }

    if (issuedBefore) {
      filteredTokens = filteredTokens.filter(token => new Date(token.iat) <= new Date(issuedBefore));
    }

    if (expiresAfter) {
      filteredTokens = filteredTokens.filter(token => new Date(token.exp) >= new Date(expiresAfter));
    }

    if (expiresBefore) {
      filteredTokens = filteredTokens.filter(token => new Date(token.exp) <= new Date(expiresBefore));
    }

    if (status) {
      const statusFilters = Array.isArray(status) ? status : [status];
      if (statusFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => statusFilters.includes(token.status));
      }
    }

    mockTokens.forEach(token => {
      if (filteredTokens.includes(token)) {
        token.status = 'not-active';
      }
    })

   return res.send({success: true});
}, { public: true })
