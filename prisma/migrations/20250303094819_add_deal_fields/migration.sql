-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "closeProbability" DOUBLE PRECISION,
ADD COLUMN     "dealValue" DOUBLE PRECISION,
ADD COLUMN     "expectedCloseDate" TIMESTAMP(3),
ADD COLUMN     "forecastValue" DOUBLE PRECISION;
