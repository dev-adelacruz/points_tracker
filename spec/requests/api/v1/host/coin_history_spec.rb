# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Host::CoinHistory" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:host) { create(:user, :host) }
  let(:other_host) { create(:user, :host) }
  let(:emcee) { create(:user, :emcee) }
  let(:team) { create(:team) }
  let(:session1) { create(:session, team: team, created_by: emcee, date: Date.current) }
  let(:session2) { create(:session, team: team, created_by: emcee, date: 1.month.ago.to_date, session_slot: :slot_two) }

  describe "#show" do
    path "/api/v1/host/coin_history" do
      get "returns the current host's coin history" do
        tags "Host::CoinHistory"
        produces "application/json"
        parameter name: :date_from, in: :query, type: :string, required: false
        parameter name: :date_to, in: :query, type: :string, required: false

        response(200, "returns coin entries for the current host") do
          before do
            create(:coin_entry, session: session1, user: host, coins: 15_000)
            create(:coin_entry, session: session2, user: host, coins: 8_000)
            create(:coin_entry, session: session1, user: other_host, coins: 20_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(2)
            coins = json_response[:data].map { |e| e[:coins] }
            expect(coins).to contain_exactly(15_000, 8_000)
          end
        end

        response(200, "filters by date range") do
          let(:date_from) { Date.current.to_s }
          let(:date_to) { Date.current.to_s }

          before do
            create(:coin_entry, session: session1, user: host, coins: 15_000)
            create(:coin_entry, session: session2, user: host, coins: 8_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:coins]).to eq(15_000)
          end
        end

        response(200, "returns empty array when no sessions") do
          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data]).to be_empty
          end
        end

        response(403, "returns forbidden for admin") do
          let(:admin) { create(:user, :admin) }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :forbidden
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
