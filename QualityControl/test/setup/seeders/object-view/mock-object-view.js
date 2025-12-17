import { CCDB_RESPONSE_BODY_KEYS, CCDB_FILTER_FIELDS } from '../../../../lib/services/ccdb/CcdbConstants.js';

const { ID, PATH, VALID_FROM, VALID_UNTIL, CREATED } = CCDB_RESPONSE_BODY_KEYS;
const { LAST_MODIFIED } = CCDB_FILTER_FIELDS;

export const MOCK_OBJECT_IDENTIFICATION_RESPONSE = {
  path: 'qc/test/object/1',
  latest: true,
  patternMatching: false,
  objects: [
    {
      [PATH]: 'qc/test/object/1',
      [ID]: '"016fa8ac-f3b6-11ec-b9a9-c0a80209250c"',
      [VALID_FROM]: 1656072357492,
      [VALID_UNTIL]: 1971432357492,
    },
  ],
  subfolders: [],
};

export const MOCK_OBJECT_12_IDENTIFICATION_RESPONSE = {
  path: 'qc/test/object/12',
  latest: true,
  patternMatching: false,
  objects: [
    {
      [PATH]: 'qc/test/object/12',
      [ID]: '"baffe0b2-826c-11ef-8f19-c0a80209250c"',
      [VALID_FROM]: 1728058750070,
      [VALID_UNTIL]: 1728058895900,
    },
  ],
  subfolders: [],
};

export const MOCK_OBJECT_1_DETAILS_RESPONSE = {
  date: 'Tue, 29 Oct 2024 13:48:07 GMT',
  server: 'Apache',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'range',
  'access-control-expose-headers': 'content-range,content-length,accept-ranges',
  'access-control-allow-methods': 'HEAD,GET',
  'cache-control': 'no-cache',
  'content-location': '/download/016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
  'valid-until': '1971432357492',
  'valid-from': '1656072357492',
  created: '1656072357533',
  etag: '"016fa8ac-f3b6-11ec-b9a9-c0a80209250c"',
  'last-modified': 'Fri, 24 Jun 2022 12:05:57 GMT',
  'content-disposition': 'inline;filename="o2-quality_control-core-QualityObject_1656072357492.root"',
  qc_check_name: 'Pedestals/mPedestalChannelFECHG',
  qc_quality: '3',
  objecttype: 'o2::quality_control::core::QualityObject',
  qc_detector_name: 'TPC',
  runnumber: '0',
  runtype: '0',
  qc_version: '1.64.0',
  partname: 'send',
  path: 'qc/test/object/1',
  'accept-ranges': 'bytes',
  'content-md5': '9defe698b8b4bfaf41ca69060c2ed1c5',
  'content-type': 'application/octet-stream',
  'content-length': '2048',
  'keep-alive': 'timeout=5, max=98',
  connection: 'Keep-Alive',
};

export const MOCK_OBJECT_12_DETAILS_RESPONSE = {
  date: 'Wed, 17 Dec 2025 21:34:40 GMT',
  server: 'Apache',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'range',
  'access-control-expose-headers': 'content-range,content-length,accept-ranges',
  'access-control-allow-methods': 'HEAD,GET',
  'cache-control': 'no-cache',
  'content-location': '/download/baffe0b2-826c-11ef-8f19-c0a80209250c',
  'valid-until': '1728058895900',
  'valid-from': '1728058750070',
  created: '1728058897718',
  etag: '"baffe0b2-826c-11ef-8f19-c0a80209250c"',
  'last-modified': 'Fri, 04 Oct 2024 16:21:37 GMT',
  'content-disposition': 'inline;filename="TObject_1728058897708.root"',
  objecttype: 'o2::quality_control_modules::common::TH1Ratio<TH1F>',
  qc_detector_name: 'MFT',
  drawoptions: 'text',
  displayhints: 'hist, gridy',
  runnumber: '551890',
  adjustableeov: '1',
  qc_task_name: 'MFTClusterTask',
  runtype: 'PHYSICS',
  qc_task_class: 'o2::quality_control_modules::mft::QcMFTClusterTask',
  periodname: 'LHC24am',
  qc_version: '1.150.0',
  partname: 'send',
  path: 'qc/MFT/MO/MFTClusterTask/ClusterRinLayer/mClusterRinLayer1',
  'accept-ranges': 'bytes',
  'content-md5': 'c0c9f6bd8783668f8e1e66f15d003809',
  'content-type': 'application/root',
  'content-length': '7168',
  'keep-alive': 'timeout=5, max=99',
  connection: 'Keep-Alive',
};

export const MOCK_OBJECT_VERSIONS_RESPONSE = {
  objects: [
    {
      [VALID_FROM]: 1656072357492,
      [CREATED]: 1656072357533,
      [ID]: '"016fa8ac-f3b6-11ec-b9a9-c0a80209250c"',
    },
    {
      [VALID_FROM]: 1655916321231,
      [CREATED]: 1655916321276,
      [ID]: '"b4944c1d-f24a-11ec-a509-c0a80209250c"',
    },
  ],
};

export const MOCK_OBJECT_12_VERSIONS_RESPONSE = {
  objects: [
    {
      [VALID_FROM]: 1728058750070,
      [CREATED]: 1728058897718,
      [ID]: 'baffe0b2-826c-11ef-8f19-c0a80209250c',
    },
  ],
};

export const MOCK_OBJECT_VERSIONS_RESPONSE_RUN_NUMBER_FILTER = {
  objects: [
    {
      [VALID_FROM]: 1656072357492,
      [CREATED]: 1656072357533,
      [ID]: '"016fa8ac-f3b6-11ec-b9a9-c0a80209250c"',
    },
  ],
};

export const MOCK_LATEST_OBJECT_FILTERED_BY_RUN_NUMBER = {
  objects: [
    {
      [PATH]: 'qc/test/object/1',
      [CREATED]: 1656072357533,
      [LAST_MODIFIED]: 1656072357492,
    },
  ],
};
