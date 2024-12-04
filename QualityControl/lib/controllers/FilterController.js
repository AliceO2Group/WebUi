export class FilterController {
  constructor(bkpService) {
    /**
     * @type {BookkeepingService}
     */
    this._bkpService = bkpService;
    this._runTypes = [];
  }

  async getRunTypesHandler(req, res) {
    try {
      res.status(200).json(this._bkpService.getRunTypes());
    } catch (error) {
      res.status(503).json({ message: error.message || error });
    }
  }
}
