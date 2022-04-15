
export class OADate
{
    static oaDateEcmaBase: number = 25569; // this is the OADate for 1/1/1970

    static ToOADate(date: Date): number
    {
        let dMsecEcmaBase: number = date.getTime();

        let dDaysEcmaBase: number = (dMsecEcmaBase / (1000.0 * 60.0 * 60.0 * 24.0));
        return dDaysEcmaBase + this.oaDateEcmaBase;
    }

    static FromOADate(oaDate: number): Date
    {
        let dDaysEcmaBase: number = oaDate - this.oaDateEcmaBase;

        return new Date(dDaysEcmaBase * 1000.0 * 60.0 * 60.0 * 24.0);
    }

    static OATimeFromMinutes(minutes: number): number
    {
        return minutes / (60 * 24);
    }
}