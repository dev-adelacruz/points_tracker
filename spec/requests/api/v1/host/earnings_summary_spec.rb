# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Host::EarningsSummary" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:host) { create(:user, :host) }
  let(:other_host) { create(:user, :host) }
  let(:emcee) { create(:user, :emcee) }
  let(:team) { create(:team) }

  describe "#show" do
    path "/api/v1/host/earnings_summary" do
      get "returns the current host's earnings summary" do
        tags "Host::EarningsSummary"
        produces "application/json"

        response(200, "returns aggregated totals for today, week, month, and all-time") do
          before do
            session_today = create(:session, team: team, created_by: emcee, date: Date.current)
            session_last_month = create(:session, team: team, created_by: emcee, date: 2.months.ago.to_date, session_slot: :slot_two)
            create(:coin_entry, session: session_today, user: host, coins: 10_000)
            create(:coin_entry, session: session_last_month, user: host, coins: 5_000)
            create(:coin_entry, session: session_today, user: other_host, coins: 99_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:today]).to eq(10_000)
            expect(data[:this_week]).to eq(10_000)
            expect(data[:this_month]).to eq(10_000)
            expect(data[:all_time]).to eq(15_000)
          end
        end

        response(200, "returns zeros when no entries") do
          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:today]).to eq(0)
            expect(data[:all_time]).to eq(0)
          end
        end

        response(403, "returns forbidden for emcee") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
